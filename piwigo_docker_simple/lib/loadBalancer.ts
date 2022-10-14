import { Stack } from "aws-cdk-lib/core";
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
    let alb = new ApplicationLoadBalancer(parent, "piwigoAlb", {
      vpc: props.Vpc,
      internetFacing: true,
      securityGroup: props.LoadBalancerSecurityGroup,
    });

    let targetGroup = new ApplicationTargetGroup(parent, "piwigoTargetGroup", {
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
  }
}
