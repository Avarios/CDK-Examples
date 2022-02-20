import { Stack, Construct } from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, Protocol, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';


export interface LoadBalancerProps {
  Vpc: Vpc,
  LoadBalancerSecurityGroup: SecurityGroup,
  TargetInstance: Instance,
  CertificateArn: string
}

export class LoadBalancer extends Construct {
  constructor(parent: Stack, id: string, props: LoadBalancerProps) {
    super(parent, id);
    let alb = new ApplicationLoadBalancer(this, 'lycheeAlb', {
      vpc: props.Vpc,
      internetFacing: true,
      securityGroup: props.LoadBalancerSecurityGroup
    });

    let targetGroup = new ApplicationTargetGroup(this, 'lycheeTargetGroup', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      vpc: props.Vpc,
      targetType: TargetType.INSTANCE
    });
    targetGroup.addTarget(new InstanceTarget(props.TargetInstance));

    alb.addListener('sslListener', {
      certificates: [
        {
          // Gets the ARN for the SSL Certificate to use
          certificateArn: props.CertificateArn
        }
      ],
      protocol: ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup]
    });
  }
}