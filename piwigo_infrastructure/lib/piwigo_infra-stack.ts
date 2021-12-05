import { Stack, StackProps, Construct, CfnParameter } from '@aws-cdk/core';
import { Vpc,SubnetType, SecurityGroup, Port, Peer, Instance } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';

export class PiwigoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let certificateArn = new CfnParameter(this,'certificateArn', {
      type:"String",
      description:"Insert the ARN for the SSL Certificate Load Balancer"
    });

    let vpc = new Vpc(this,'piwigovpc', {
      cidr : '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'piwigoSubnet',
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name:'databaseSubnet',
          subnetType:SubnetType.PRIVATE_ISOLATED,
          cidrMask:28
        },
        {
          name:'natSubnet',
          subnetType:SubnetType.PUBLIC
        }
      ],
      maxAzs:2
    });

    let albSecurityGroup = new SecurityGroup(this,'alb-sg',{
      vpc:vpc,
      allowAllOutbound:true,
    });
    albSecurityGroup.addIngressRule(Peer.anyIpv4(),Port.tcp(443));

    let piwigoSecurityGroup = new SecurityGroup(this,'piwigo-sg',{
      vpc:vpc,
      allowAllOutbound:true,
    });

    piwigoSecurityGroup.addIngressRule(albSecurityGroup, Port.tcp(80));

    let databaseSecurityGroup = new SecurityGroup(this,'db-sg',{
      vpc:vpc,
      allowAllOutbound:true,
    });

    databaseSecurityGroup.addIngressRule(piwigoSecurityGroup,Port.tcp(3306));



    let loadbalancer = new ApplicationLoadBalancer(this,'piwigoAlb', {
      vpc: vpc,
      internetFacing:true,
      securityGroup: albSecurityGroup
    });

    let targetGroup = new ApplicationTargetGroup(this,'piwigoTargetGroup',{
      port:80,
      protocol:ApplicationProtocol.HTTP,
      vpc:vpc
    });

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
}
