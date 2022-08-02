import { CfnJson, RemovalPolicy, Size, Stack } from "aws-cdk-lib";
import { CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Effect, IGrantable, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

/**
 * Properties for the OpenSearchConstruct
 */
export interface OpenSearchConstructProps {
    ApplicationPrefix: string
    IdentityPoolId: string,
    OpenSearchRole: Role,
    AdminSearchRole: Role,
    LimitedSearchRole: Role,
    UserPoolId: string,
    UserPoolArn:string,
    //OpenSearchLambdaGrant: IGrantable
}

export class OpenSearchConstruct extends Construct {

    private openSearchDomainUrl:string;

    /**
     * Creates the OpenSearch Cluster
     */
    constructor(parent: Stack, id: string, props: OpenSearchConstructProps) {
        super(parent, id);

        let openSearchDomainArn = "arn:aws:es:" + parent.region + ":" + parent.account + ":domain/" + props.ApplicationPrefix + "/*"
        let accessPolicies = this.generateAccessPolicies(openSearchDomainArn, props.OpenSearchRole, props.AdminSearchRole, props.LimitedSearchRole);
        let openSearchDomain = new Domain(parent, 'openSearchDomain', {
            version: EngineVersion.openSearch("1.3"),
            domainName: props.ApplicationPrefix,
            capacity: {
                masterNodeInstanceType: 't3.small.search',
            },
            nodeToNodeEncryption: true,
            cognitoDashboardsAuth: {
                identityPoolId: props.IdentityPoolId,
                role: props.OpenSearchRole,
                userPoolId: props.UserPoolId
            },
            ebs: {
                enabled: true,
                volumeSize: Size.gibibytes(10).toGibibytes()
            },
            encryptionAtRest: { enabled: true },
            removalPolicy: RemovalPolicy.DESTROY,
            accessPolicies: [
                ...accessPolicies
            ]
        });
        //openSearchDomain.grantReadWrite(props.OpenSearchLambdaGrant);

        let userPoolClients = new AwsCustomResource(this, 'clientIdResource', {
            policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: [props.UserPoolArn] }),
            onCreate: {
                service: 'CognitoIdentityServiceProvider',
                action: 'listUserPoolClients',
                parameters: {
                    UserPoolId: props.UserPoolId
                },
                physicalResourceId: PhysicalResourceId.of(`ClientId-${props.ApplicationPrefix}`)
            },
            logRetention: RetentionDays.ONE_DAY
        });

        userPoolClients.node.addDependency(openSearchDomain);
        let clientId = userPoolClients.getResponseField('UserPoolClients.0.ClientId')

        new CfnIdentityPoolRoleAttachment(this, 'userPoolRoleAttachment', {
            identityPoolId: props.IdentityPoolId,
            roles: {
                'authenticated': props.LimitedSearchRole.roleArn
            },
            roleMappings: new CfnJson(this, 'roleMappingsJson', {
                value: {
                    [`cognito-idp.${parent.region}.amazonaws.com/${props.UserPoolId}:${clientId}`]: {
                        Type: 'Token',
                        AmbiguousRoleResolution: 'AuthenticatedRole'
                    }
                }
            })
        });

        this.openSearchDomainUrl = openSearchDomain.domainEndpoint;
    }

    private generateAccessPolicies(domainArn: string, standardRole: Role, adminRole: Role, limitedRole: Role): PolicyStatement[] {
        return [
            // StandardPolicy
            new PolicyStatement({
                actions: ['es:ESHttpGet','es:ESHttpPut','es:ESHttpPost'],
                effect: Effect.ALLOW,
                principals: [standardRole],
                resources: [domainArn]
            }),
            // LimitedPolicy
            new PolicyStatement({
                actions: ['es:ESHttpGet'],
                effect: Effect.ALLOW,
                principals: [
                    limitedRole
                ],
                resources: [domainArn]
            }),
            // AdminPolicy
            new PolicyStatement({
                actions: ['es:*'],
                effect: Effect.ALLOW,
                principals: [
                    adminRole
                ],
                resources: [domainArn]
            }),
        ]
    };

    get OpenSearchDomainUrl():string  {
        return this.openSearchDomainUrl;
    }
}