import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { AccountRecovery, CfnIdentityPool, CfnIdentityPoolRoleAttachment, UserPool, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class CognitoConstruct extends Construct {

    private identityPoolId: string;
    private userPoolId:string;
    private userPoolArn:string;


    //TODO: Add Service linked policy 
    constructor(parent: Stack, id: string, poolDomain: string, authenticatedRole:Role) {
        super(parent, id);

        let cognitoUserPool = new UserPool(parent, 'osCognitoUserPool', {
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            standardAttributes: {
                preferredUsername: { required: true },
                email: { mutable: true, required: true }
            },
            autoVerify: { email: true },
            removalPolicy: RemovalPolicy.DESTROY
        });
        let userPoolDomain = new UserPoolDomain(parent, 'osCognitoUserPoolDomain', {
            cognitoDomain: {
                domainPrefix: poolDomain
            },
            userPool: cognitoUserPool
        });

        let cfnIdentityPool = new CfnIdentityPool(parent, "osCfnIdentityPool", {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: []
        });
          
        this.userPoolId = cognitoUserPool.userPoolId;
        this.userPoolArn = cognitoUserPool.userPoolArn;
        this.identityPoolId = cfnIdentityPool.ref;
    }

    get UserPoolId(): string {
        return this.userPoolId;
    }

    get IdentityPoolId(): string {
        return this.identityPoolId;
    }

    get UserPoolArn():string {
        return this.userPoolArn;
    }

}