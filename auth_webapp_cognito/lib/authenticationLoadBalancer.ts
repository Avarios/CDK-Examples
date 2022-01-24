import * as cdk from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, Protocol, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { AuthenticateCognitoAction } from '@aws-cdk/aws-elasticloadbalancingv2-actions';
import { AccountRecovery, Mfa, OAuthScope, UserPool, UserPoolClient, UserPoolDomain, UserPoolEmail } from '@aws-cdk/aws-cognito';
import { CfnOutput } from '@aws-cdk/core';

export interface LoadBalancerProps {
    Vpc: Vpc,
    LoadBalancerSecurityGroup: SecurityGroup,
    TargetInstance: Instance,
    ReplyMailAdress:string
}

export class AuthenticationLoadBalancer extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: LoadBalancerProps) {
        super(scope, id);
        let alb = new ApplicationLoadBalancer(this, 'webAppAlb', {
            vpc: props.Vpc,
            securityGroup: props.LoadBalancerSecurityGroup,
            internetFacing: true
        });

        let targetGroup = new ApplicationTargetGroup(scope, 'webappTarget', {
            targetType: TargetType.INSTANCE,
            healthCheck: {
                enabled: true,
                path: '/',
                interval: cdk.Duration.seconds(20),
                protocol: Protocol.HTTP
            },
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            vpc: props.Vpc,
            targets: [new InstanceTarget(props.TargetInstance)]
        });

        let cognitoUserPool = new UserPool(this, 'authWebUserPool', {
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            mfa: Mfa.OPTIONAL,
            email: UserPoolEmail.withCognito(),
            selfSignUpEnabled: true,
            standardAttributes: {
                email: { required: true },
                givenName: { required: true },
                familyName: { required: true }
            }
        });

        let cognitoUserPoolClient = new UserPoolClient(this, 'authBackendClient', {
            userPool: cognitoUserPool,
            generateSecret: true,
            authFlows: {
                userPassword: true
            },
            oAuth: {
                callbackUrls: [`https://${alb.loadBalancerDnsName}/oauth2/idpresponse`],
                scopes: [OAuthScope.EMAIL],
                flows: {
                    authorizationCodeGrant: true
                }
            }
        });

        let cognitoUserPoolDomain = new UserPoolDomain(this, 'authUserPoolDomain', {
            userPool: cognitoUserPool,
            cognitoDomain: {
                domainPrefix: 'pwarmuth-auth-test'
            }
        });

        let authUrl =  cognitoUserPoolDomain.signInUrl(cognitoUserPoolClient,{
            redirectUri:`https://${alb.loadBalancerDnsName}`
        })

        let authurlOutput = new CfnOutput(this,'authUrl', {
            value:authUrl,
            description: 'The Signin URL'
        });


        alb.addListener('instanceListener', {
            protocol: ApplicationProtocol.HTTP,
            port:80,
            open: true,
            defaultAction: new AuthenticateCognitoAction({
                userPool: cognitoUserPool,
                userPoolClient: cognitoUserPoolClient,
                userPoolDomain: cognitoUserPoolDomain,
                next: ListenerAction.forward([targetGroup])
            })
        });

    }
}