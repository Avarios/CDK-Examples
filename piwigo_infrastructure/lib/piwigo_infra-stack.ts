import { Stack, StackProps, Construct, CfnParameter } from '@aws-cdk/core';
import { Vpc,SubnetType, SecurityGroup, Port, Peer, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';

export class PiwigoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let certificateArn = this.getCertificateArn();

    let vpc = this.createVpc();

    let albSecurityGroup = this.createSecurityGroup(vpc,'alb-sg',true);
    albSecurityGroup.addIngressRule(Peer.anyIpv4(),Port.tcp(443));

    let piwigoSecurityGroup = this.createSecurityGroup(vpc,'piwigo-sg',true);
    piwigoSecurityGroup.addIngressRule(albSecurityGroup, Port.tcp(80));

    let databaseSecurityGroup = this.createSecurityGroup(vpc,'db-sg',true);
    databaseSecurityGroup.addIngressRule(piwigoSecurityGroup,Port.tcp(3306));

    let loadbalancer = this.createApplicationLoadBalancer(vpc, albSecurityGroup);

    let targetGroup = this.createAlbTargetGroup(vpc);

    loadbalancer.addListener('sslListener', {
      certificates:[
        {
          certificateArn: certificateArn.valueAsString
        }
      ],
      protocol:ApplicationProtocol.HTTPS,
      defaultTargetGroups:[targetGroup]
    })
  }

  private createAlbTargetGroup(vpc: Vpc) {
    return new ApplicationTargetGroup(this, 'piwigoTargetGroup', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      vpc: vpc
    });
  }

  private createApplicationLoadBalancer(vpc: Vpc, albSecurityGroup: SecurityGroup) {
    return new ApplicationLoadBalancer(this, 'piwigoAlb', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup
    });
  }

  private createSecurityGroup(vpc: Vpc, id: string, allowAllOutbound: boolean) {
    return new SecurityGroup(this, id, {
      vpc: vpc,
      allowAllOutbound: allowAllOutbound,
    });
  }

  private createVpc() {
    return new Vpc(this, 'piwigovpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'piwigoSubnet',
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name: 'databaseSubnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28
        },
        {
          name: 'natSubnet',
          subnetType: SubnetType.PUBLIC
        }
      ],
      maxAzs: 2
    });
  }

  private getCertificateArn() {
    return new CfnParameter(this, 'certificateArn', {
      type: "String",
      description: "Insert the ARN for the SSL Certificate Load Balancer"
    });
  }
}
