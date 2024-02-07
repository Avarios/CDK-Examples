import { SecurityGroup, IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, Protocol, TargetType, UnauthenticatedAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceIdTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { AuthenticateCognitoAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2-actions';
import {
    AccountRecovery, CfnUserPoolClient, Mfa, OAuthScope, UserPool, UserPoolClient, UserPoolClientIdentityProvider,
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

        let alb = new ApplicationLoadBalancer(this, 'webapplb', {
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
        targetGroup.addTarget(instanceTarget);

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

        let cognitoUserPoolDomain = new UserPoolDomain(this, 'authUserPoolDomain', {
            userPool: cognitoUserPool,
            cognitoDomain: {
                domainPrefix: config.cognitoDomanPrefix,
            },
        });

        
        /* let redirects = [
            `https://${this.AlbDnsName}`,
            `https://${this.AlbDnsName}/oauth2/idpresponse`,
            `https://${this.AlbDnsName}/oauth2/idpresponse/`,
            `https://${this.AlbDnsName}/`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/saml2/idpresponse/`.toLowerCase(),
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/saml2/idpresponse`.toLowerCase(),
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/saml2/idpresponse/`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/saml2/idpresponse`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/oauth2/idpresponse/`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/oauth2/idpresponse`
        ] */

        let redirects = [
            `https://${this.AlbDnsName}/oauth2/idpresponse`,
            `https://${this.AlbDnsName}`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/oauth2/idpresponse`,
            `https://${config.cognitoDomanPrefix}.auth.${config.region}.amazoncognito.com/saml2/idpresponse`
        ]


        let cognitoClient = cognitoUserPool.addClient('albclinet',{
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            generateSecret: true,
            oAuth: {
                callbackUrls: redirects,
                scopes: [OAuthScope.OPENID],
                flows: {
                    authorizationCodeGrant:true,
                }
            },
            userPoolClientName: 'authBackendUserpoolClient'
        })

        let signInUrl = cognitoUserPoolDomain.signInUrl(cognitoClient,{
            redirectUri: `https://${this.AlbDnsName}`
        })

        let listener = alb.addListener('instanceListener', {
            protocol: ApplicationProtocol.HTTPS,
            open: true,
            certificates: [{ certificateArn: props.certificateArn }],
            defaultAction: new AuthenticateCognitoAction({
                onUnauthenticatedRequest: UnauthenticatedAction.AUTHENTICATE,
                userPool: cognitoUserPool,
                userPoolClient: cognitoClient,
                userPoolDomain: cognitoUserPoolDomain,
                next: ListenerAction.forward([targetGroup]),
                scope: `${OAuthScope.OPENID.scopeName} `
            }),
        });

        const cfnClient = cognitoClient.node.defaultChild as CfnUserPoolClient;
        cfnClient.addPropertyOverride('RefreshTokenValidity', 1);
        cfnClient.addPropertyOverride('SupportedIdentityProviders', ['COGNITO']);
        cfnClient.allowedOAuthFlowsUserPoolClient = true;
        

        let dnsLb = new CfnOutput(this, 'LoadBalancer DNS', {
            value: "https://" +  this.AlbDnsName,
            description: 'The DNS URL for the ALB'
        });

        new CfnOutput(this, 'SignInUrl', {
            value: signInUrl,
            description: 'Cognito Signin Url'
        });

    }
}