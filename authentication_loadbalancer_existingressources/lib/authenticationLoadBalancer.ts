import { SecurityGroup, IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, Protocol, TargetType, UnauthenticatedAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceIdTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { AuthenticateCognitoAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2-actions';
import {
    AccountRecovery, Mfa, OAuthScope, UserPool, UserPoolClient, UserPoolClientIdentityProvider,
    UserPoolDomain, UserPoolEmail
} from 'aws-cdk-lib/aws-cognito';
import { CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { config } from './parameters';

export interface LoadBalancerProps {
    LoadBalancerSecurityGroup: SecurityGroup
    certificateArn: string,
    TargetInstanceId: string,
    TargetInstancePort: number,
    Vpc:IVpc
}

export class AuthenticationLoadBalancer extends Construct {

    private AlbDnsName: string

    constructor(scope: Construct, id: string, props: LoadBalancerProps) {
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
                interval: Duration.seconds(60),
                protocol: Protocol.HTTP
            },
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            vpc:props.Vpc
        });

        let instanceTarget = new InstanceIdTarget(props.TargetInstanceId, props.TargetInstancePort);
        instanceTarget.attachToApplicationTargetGroup(targetGroup);

        let cognitoUserPool = new UserPool(this, 'authWebUserPool', {
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            mfa: Mfa.OFF,
            email: UserPoolEmail.withCognito(),
            selfSignUpEnabled: true,
            standardAttributes: {
                email: { required: true }
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
            disableOAuth: false,
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