import * as cdk from '@aws-cdk/core';
import { AccountRecovery, Mfa, OAuthScope, UserPool, UserPoolClient, UserPoolDomain, UserPoolEmail } from '@aws-cdk/aws-cognito';

export class Authentication extends cdk.Construct {

    public readonly UserPoolClient: UserPoolClient;
    public readonly UserPool: UserPool;
    public readonly UserPoolDomain: UserPoolDomain;

    constructor(scope: cdk.Construct, id: string, loadBalancerDnsName: string) {
        super(scope, id);

        this.UserPool = new UserPool(this, 'authWebUserPool', {
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            mfa: Mfa.OPTIONAL,
            email: UserPoolEmail.withCognito('ADD REPLY MAIL HERE'),
            selfSignUpEnabled: true
        });

        this.UserPoolClient = new UserPoolClient(this, 'authBackendClient', {
            userPool: this.UserPool,
            generateSecret: true,
            authFlows: {
                userPassword: true
            },
            oAuth: {
                callbackUrls: [`https://${loadBalancerDnsName}}/oauth2/idpresponse`],
                scopes: [OAuthScope.EMAIL],
                flows: {
                    authorizationCodeGrant: true
                }
            }
        });

        this.UserPoolDomain = new UserPoolDomain(this, 'authUserPoolDomain', {
            userPool: this.UserPool,
        });
    }
}