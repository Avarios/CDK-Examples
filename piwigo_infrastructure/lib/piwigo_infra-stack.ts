import { Stack, StackProps, Construct, CfnParameter, Size } from '@aws-cdk/core';
import {
  Vpc, SubnetType, SecurityGroup, Port, Peer, Instance, InstanceType, InstanceClass,
  InstanceSize, MachineImage, BlockDeviceVolume, EbsDeviceVolumeType, IPeer, Protocol
} from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, IApplicationLoadBalancerTarget, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';

export class PiwigoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //Creates a VPC
    let vpc = this.createVpc();

    // Security Group for the ALB
    // Allow traffic from anywhere to the ALB on Port 443
    // Allow traffic from anywhere to the ALB on Port SSH
    let albSecurityGroup = this.createSecurityGroup(vpc, 'alb-sg', true,
      [
        { Peer: Peer.anyIpv4(), Port: Port.tcp(443) },
        { Peer: Peer.anyIpv4(), Port: Port.tcp(22) }
      ]);

    // Security Group for the EC Instance
    // Allow Traffic from the ALB on Port 80
    // Allow Traffic from the ALB on Port SSH
    let piwigoSecurityGroup = this.createSecurityGroup(vpc, 'piwigo-sg', true,
      [
        { Peer: albSecurityGroup, Port: Port.tcp(80) },
        { Peer: albSecurityGroup, Port: Port.tcp(22) }
      ]);

    // Security Group for the Database layer
    // Allow traffic on port 3306 from the EC2 Instance SG
    this.createSecurityGroup(vpc, 'db-sg', false,
      [{ Peer: piwigoSecurityGroup, Port: Port.tcp(443) }]);

    let loadbalancer = this.createApplicationLoadBalancer(vpc, albSecurityGroup);
    let piwigoEc2 = this.createEc2Instance(vpc, piwigoSecurityGroup);
    piwigoEc2.userData.addCommands('sudo amazon-linux-extras install nginx1');
    let targetGroup = this.createAlbTargetGroup(vpc, new InstanceTarget(piwigoEc2));

    loadbalancer.addListener('sslListener', {
      certificates: [
        {
          // Gets the ARN for the SSL Certificate to use
          certificateArn: this.getCertificateArn().valueAsString
        }
      ],
      protocol: ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup]
    });
  }

  private createEc2Instance(vpc: Vpc, defaultSecurityGroup?: SecurityGroup): Instance {
    let instance = new Instance(this, 'piwigoec2', {
      instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL),
      machineImage: MachineImage.latestAmazonLinux(),
      vpc: vpc,
      instanceName: 'piwigoweb',
      blockDevices: [
        {
          deviceName: '/dev/sdh',
          volume: BlockDeviceVolume.ebs(Size.gibibytes(200).toGibibytes(), {
            volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD
          })
        }
      ]
    });

    if (defaultSecurityGroup) {
      instance.addSecurityGroup(defaultSecurityGroup);
    }

    return instance;
  }

  private createAlbTargetGroup(vpc: Vpc, defaultTarget?: IApplicationLoadBalancerTarget): ApplicationTargetGroup {
    let targetGroup = new ApplicationTargetGroup(this, 'piwigoTargetGroup', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      vpc: vpc,
      targetType: TargetType.INSTANCE
    });
    if (defaultTarget) {
      targetGroup.addTarget(defaultTarget)
    }

    return targetGroup;
  }

  private createApplicationLoadBalancer(vpc: Vpc, albSecurityGroup: SecurityGroup) {
    return new ApplicationLoadBalancer(this, 'piwigoAlb', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup
    });
  }

  private createSecurityGroup(
    vpc: Vpc, id: string, allowAllOutbound: boolean, allowedSecurityGroups?: { Peer: IPeer, Port: Port }[]): SecurityGroup {
    let securityGroup = new SecurityGroup(this, id, {
      vpc: vpc,
      allowAllOutbound: allowAllOutbound,
    });

    allowedSecurityGroups?.forEach(grp => {
      securityGroup.addIngressRule(grp.Peer, grp.Port);
    });

    return securityGroup;
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
