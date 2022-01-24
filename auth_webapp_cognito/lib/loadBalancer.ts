import * as cdk from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, Protocol, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { AuthenticateCognitoAction } from '@aws-cdk/aws-elasticloadbalancingv2-actions';
import { UserPool, UserPoolClient, UserPoolDomain } from '@aws-cdk/aws-cognito';


export interface LoadBalancerProps {
  Vpc: Vpc,
  LoadBalancerSecurityGroup: SecurityGroup,
  TargetInstance: Instance
}

export class LoadBalancer extends cdk.Construct {

  private readonly LoadBalancerInstance: ApplicationLoadBalancer;
  private readonly Ec2TargetGroup: ApplicationTargetGroup;
  public readonly LoadBalancerDnsName:string;

  constructor(scope: cdk.Construct, id: string, props: LoadBalancerProps) {
    super(scope, id);
    this.LoadBalancerInstance = new ApplicationLoadBalancer(this, 'webAppAlb', {
      vpc: props.Vpc,
      securityGroup: props.LoadBalancerSecurityGroup,
      internetFacing: true
    });

    this.Ec2TargetGroup = new ApplicationTargetGroup(scope, 'webappTarget', {
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
    this.LoadBalancerDnsName = this.LoadBalancerInstance.loadBalancerDnsName;
  }

  public AddCognitoListener(applicationUserPool: UserPool, applicationUserPoolClient: UserPoolClient,
    applicationUserPoolDomain: UserPoolDomain) {
    this.LoadBalancerInstance.addListener('instanceListener', {
      protocol: ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.Ec2TargetGroup],
      defaultAction: new AuthenticateCognitoAction({
        userPool: applicationUserPool,
        userPoolClient: applicationUserPoolClient,
        userPoolDomain: applicationUserPoolDomain,
        next: ListenerAction.fixedResponse(200, {
          contentType: "text/plain",
          messageBody: "authenticated"
        })
      })
    });
  }
}