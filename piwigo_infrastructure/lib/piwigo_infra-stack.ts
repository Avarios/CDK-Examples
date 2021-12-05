import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { Vpc,SubnetType, SecurityGroup, Port, Protocol, Peer } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';

export class PiwigoInfraStack extends Stack {

  readonly vpc:Vpc;
  readonly loadbalancer: ApplicationLoadBalancer;
  readonly albSecurityGroup: SecurityGroup;
  readonly piwigoSecurityGroup: SecurityGroup;
  readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.albSecurityGroup = new SecurityGroup(this,'alb-sg',{
      vpc:this.vpc,
      allowAllOutbound:true,
    });
    this.albSecurityGroup.addIngressRule(Peer.anyIpv4(),Port.tcp(443));

    this.piwigoSecurityGroup = new SecurityGroup(this,'piwigo-sg',{
      vpc:this.vpc,
      allowAllOutbound:true,
    });

    this.piwigoSecurityGroup.addIngressRule(this.albSecurityGroup, Port.tcp(80));

    this.databaseSecurityGroup = new SecurityGroup(this,'db-sg',{
      vpc:this.vpc,
      allowAllOutbound:true,
    });

    this.databaseSecurityGroup.addIngressRule(this.piwigoSecurityGroup,Port.tcp(3306));

    this.vpc = new Vpc(this,'piwigovpc', {
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
        }
      ],
      maxAzs:2
    });

    this.loadbalancer = new ApplicationLoadBalancer(this,'piwigoAlb', {
      vpc: this.vpc,
      internetFacing:true,
      securityGroup: this.albSecurityGroup
    });

  }
}
