import * as cdk from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, Protocol, TargetType, UnauthenticatedAction } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { AuthenticateCognitoAction } from '@aws-cdk/aws-elasticloadbalancingv2-actions';
import {
    AccountRecovery, Mfa, OAuthScope, UserPool, UserPoolClient, UserPoolClientIdentityProvider,
    UserPoolDomain, UserPoolEmail
} from '@aws-cdk/aws-cognito';
import { CfnOutput, RemovalPolicy } from '@aws-cdk/core';

export interface LoadBalancerProps {
    Vpc: Vpc,
    LoadBalancerSecurityGroup: SecurityGroup
    ReplyMailAdress: string,
    certificateArn: string,
    TargetInstance: Instance,
}

export class AuthenticationLoadBalancer extends cdk.Construct {

    private AlbDnsName: string

    constructor(scope: cdk.Construct, id: string, props: LoadBalancerProps) {
        super(scope, id);
        let alb = new ApplicationLoadBalancer(this, 'webAppAlb', {
            vpc: props.Vpc,
            securityGroup: props.LoadBalancerSecurityGroup,
            internetFacing: true
        });

        this.AlbDnsName = alb.loadBalancerDnsName;

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
            mfa: Mfa.OFF,
            email: UserPoolEmail.withCognito(),
            selfSignUpEnabled: true,
            standardAttributes: {
                email: { required: true }
            },
            // Only used for demo, it depends on your use case if you want to auto approve users
            autoVerify: {
                email: true,
                phone: true
            },
            removalPolicy: RemovalPolicy.DESTROY
        });

        let callBackURL = `https://${this.AlbDnsName}/oauth2/idpresponse/`;
        let redirectURI = `https://${this.AlbDnsName}/`;

        let cognitoUserPoolClient = new UserPoolClient(this, 'authBackendClient', {
            userPool: cognitoUserPool,
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            generateSecret: true,
            authFlows: {
                userPassword: true
            },
            oAuth: {
                callbackUrls: [callBackURL, redirectURI],
                scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
                flows: {
                    authorizationCodeGrant: true
                }
            },
            userPoolClientName: 'authBackendUserpoolClient',
            disableOAuth: false
        });

        let cognitoUserPoolDomain = new UserPoolDomain(this, 'authUserPoolDomain', {
            userPool: cognitoUserPool,
            cognitoDomain: {
                domainPrefix: 'pwarmuth-auth-test',

            },
        });

        let authUrl = cognitoUserPoolDomain.signInUrl(cognitoUserPoolClient, {
            redirectUri: redirectURI
        })


        alb.addListener('instanceListener', {
            protocol: ApplicationProtocol.HTTPS,
            open: true,
            certificates: [{ certificateArn: props.certificateArn }],
            defaultAction: new AuthenticateCognitoAction({
                onUnauthenticatedRequest: UnauthenticatedAction.AUTHENTICATE,
                userPool: cognitoUserPool,
                userPoolClient: cognitoUserPoolClient,
                userPoolDomain: cognitoUserPoolDomain,
                next: ListenerAction.forward([targetGroup])
            })
        });


        let cognitoAuthUrl = new CfnOutput(this, 'authUrl', {
            value: authUrl,
            description: 'The Signin URL'
        });

        let dnsLb = new CfnOutput(this, 'LoadBalancer DNS', {
            value: this.AlbDnsName,
            description: 'The DNS URL for the ALB'
        });

    }
}