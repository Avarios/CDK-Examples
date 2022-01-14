import * as cdk from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, Protocol, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';


export interface LoadBalancerProps {
  Vpc: Vpc,
  LoadBalancerSecurityGroup: SecurityGroup,
  TargetInstance: Instance
}

export class LoadBalancer extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: LoadBalancerProps) {
    super(scope, id);
    let alb = new ApplicationLoadBalancer(this, 'webAppAlb', {
      vpc: props.Vpc,
      securityGroup: props.LoadBalancerSecurityGroup,
      internetFacing: true
    });

    let instanceTarget = new ApplicationTargetGroup(scope, 'webappTarget', {
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

    alb.addListener('instanceListener', {
      protocol: ApplicationProtocol.HTTPS,
      defaultTargetGroups: [instanceTarget],
      certificates: [{ certificateArn: 'ADD ARN HERE' }]
    });
  }
}