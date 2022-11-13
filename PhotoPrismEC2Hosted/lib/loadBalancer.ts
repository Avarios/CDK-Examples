import { CfnOutput, Stack } from "aws-cdk-lib";
import { Vpc, SecurityGroup, Instance } from "aws-cdk-lib/aws-ec2";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { InstanceTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { Construct } from "constructs";

export interface LoadBalancerProps {
  Vpc: Vpc;
  LoadBalancerSecurityGroup: SecurityGroup;
  TargetInstance: Instance;
  CertificateArn: string;
}

export class LoadBalancer extends Construct {
  constructor(parent: Stack, id: string, props: LoadBalancerProps) {
    super(parent, id);
    const alb = new ApplicationLoadBalancer(parent, "PrismAlb", {
      vpc: props.Vpc,
      internetFacing: true,
      securityGroup: props.LoadBalancerSecurityGroup,
    });

    const targetGroup = new ApplicationTargetGroup(parent, "PrismHostTargetGroup", {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      vpc: props.Vpc,
      targetType: TargetType.INSTANCE,
    });
    targetGroup.addTarget(new InstanceTarget(props.TargetInstance, 80));

    alb.addListener("sslListener", {
      certificates: [
        {
          // Gets the ARN for the SSL Certificate to use
          certificateArn: props.CertificateArn,
        },
      ],
      protocol: ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup],
    });

    new CfnOutput(this,'ALB DNS Name', {
      value: alb.loadBalancerDnsName,
      description: 'DNS Adress ALB'
    })
  }
}
