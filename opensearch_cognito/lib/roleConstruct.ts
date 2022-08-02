import { Stack } from "aws-cdk-lib";
import { CfnUserPoolGroup } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, Role, ManagedPolicy, PolicyStatement, ServicePrincipal, CfnUser } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

/**
 * Creates all needed Roles for the OpenSearchCluster and Cognito
 */

export class Roles extends Construct {

    private lambdaAdminRole: Role;
    private osRole: Role;
    private osAdminRole: Role;
    private osLimitedRole: Role;
    private cfnUsrPoolGroup: CfnUserPoolGroup;

    constructor(parent: Stack, cognitoUserPoolId: string, applicationPrefix: string) {
        super(parent, 'roleConstruct')
        this.lambdaAdminRole = new Role(parent, "osAdminFnRole", {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        });
        this.lambdaAdminRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
        this.osRole = new Role(parent, "osRole", {
            assumedBy: new ServicePrincipal('es.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("AmazonOpenSearchServiceCognitoAccess")]
        });
        this.osAdminRole = new Role(parent, "osAdminUserRole", {
            assumedBy:
                new FederatedPrincipal('cognito-identity.amazonaws.com', {
                    "StringEquals": { "cognito-identity.amazonaws.com:aud": cognitoUserPoolId },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    }
                }, "sts:AssumeRoleWithWebIdentity")
        });
        this.cfnUsrPoolGroup = new CfnUserPoolGroup(parent, "userPoolAdminGroupPool", {
            userPoolId: cognitoUserPoolId,
            groupName: "es-admins",
            roleArn: this.osAdminRole.roleArn
        });

        this.osLimitedRole = new Role(parent, "osLimitedUserRole", {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": cognitoUserPoolId },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "authenticated"
                }
            }, "sts:AssumeRoleWithWebIdentity")
        });
        new ManagedPolicy(parent, "openSearchHttpPolicy", {
            roles: [this.osAdminRole, this.lambdaAdminRole],
            statements: [new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [`arn:aws:es:${parent.region}:${parent.account}:domain/${applicationPrefix}/*}`],
                actions: ['es:ESHttpPost', 'es:ESHttpGet', 'es:ESHttpPut']
            })]
        });
    }

    get adminLambdaFunctionRole(): Role {
        return this.lambdaAdminRole;
    }

    get openSearchRole(): Role {
        return this.osRole;
    }

    get openSearchAdminRole(): Role {
        return this.osAdminRole;
    }

    get cfnUserPoolGroup(): CfnUserPoolGroup {
        return this.cfnUsrPoolGroup;
    }

    get openSearchLimitedRole(): Role {
        return this.osLimitedRole;
    }
}