import { Stack, StackProps, Construct, CfnParameter, Size, CfnOutput } from '@aws-cdk/core';
import {
  Vpc, SubnetType, SecurityGroup, Port, Peer, Instance, InstanceType, InstanceClass,
  InstanceSize, MachineImage, BlockDeviceVolume, EbsDeviceVolumeType, IPeer, AmazonLinuxGeneration, CloudFormationInit, InitCommand, IMachineImage
} from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, IApplicationLoadBalancerTarget, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { DatabaseProps } from './database-stack';


const ec2SubnetName = 'piwigoSubnet'
const databaseSubnetName = 'piwigoDatabaseSubnet';

export class PiwigoInfraStack extends Stack {

  public stackProps: DatabaseProps;

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
    let databaseSecurityGroup = this.createSecurityGroup(vpc, 'db-sg', false,
      [{ Peer: piwigoSecurityGroup, Port: Port.tcp(443) }]);

    let loadbalancer = this.createApplicationLoadBalancer(vpc, albSecurityGroup);
    let piwigoEc2 = this.createEc2Instance(vpc, piwigoSecurityGroup);
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

    let publicUrl = new CfnOutput(this, 'piwigoUrl', {
      value: `http://${loadbalancer.loadBalancerDnsName}/netinstall.php`,
      description: 'The URL of the endpoints',
      exportName: 'piwigoUrl'
    });

    this.stackProps = {
      subnetGroupName: databaseSubnetName,
      ec2Role: piwigoEc2.role,
      accessingEc2: piwigoEc2,
      rdsSecurityGroup: databaseSecurityGroup,
      vpc: vpc
    }
  }

  private getShellCommandsForPiwigo(): CloudFormationInit {
    return CloudFormationInit.fromElements(
      InitCommand.shellCommand('sudo amazon-linux-extras enable nginx1 php8.0'),
      InitCommand.shellCommand('sudo yum clean metadata'),
      InitCommand.shellCommand('sudo yum -y install nginx'),
      InitCommand.shellCommand('sudo yum -y install php php-{cli,fpm,pear,cgi,common,curl,mbstring,gd,mysqlnd,gettext,bcmath,json,xml,intl,zip,imap}'),
      InitCommand.shellCommand('sudo systemctl enable --now nginx'),
      InitCommand.shellCommand('sudo systemctl enable php-fpm'),
      InitCommand.shellCommand("sudo sed -i 's/user = apache/user = nginx/g' /etc/php-fpm.d/www.conf"),
      InitCommand.shellCommand("sudo sed -i 's/group = apache/group = nginx/g' /etc/php-fpm.d/www.conf"),
      InitCommand.shellCommand("sudo sed -i 's/pm = dynamic/pm = ondemand/g' /etc/php-fpm.d/www.conf"),
      InitCommand.shellCommand("sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/g' /etc/php.ini"),
      InitCommand.shellCommand("sudo sed -i 's/max_input_time = 60/max_input_time = 300/g' /etc/php.ini"),
      InitCommand.shellCommand("sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/g' /etc/php.ini"),
      InitCommand.shellCommand("sudo sed -i 's/post_max_size = 8M/post_max_size = 32M/g' /etc/php.ini"),
      InitCommand.shellCommand("sudo wget https://raw.githubusercontent.com/Ahrimaan/CDK-Examples/main/piwigo_infra_wo_lb/res/nginx.conf_ -P /etc/nginx/"),
      InitCommand.shellCommand("sudo mv /etc/nginx/nginx.conf_ /etc/nginx/nginx.conf"),
      InitCommand.shellCommand("sudo wget https://piwigo.org/download/dlcounter.php?code=netinstall -P /usr/share/nginx/html/"),
      InitCommand.shellCommand("sudo mv /usr/share/nginx/html/dlcounter.php\?code\=netinstall /usr/share/nginx/html/netinstall.php"),
      InitCommand.shellCommand("sudo chmod 777 /usr/share/nginx/html/"),
      InitCommand.shellCommand("sudo systemctl restart php-fpm"),
      InitCommand.shellCommand("sudo systemctl restart nginx"),
    )
  }

  private createEc2Instance(vpc: Vpc, defaultSecurityGroup?: SecurityGroup): Instance {
    let instance = new Instance(this, 'piwigoec2', {
      instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL),
      machineImage: MachineImage.latestAmazonLinux({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      vpc: vpc,
      instanceName: 'piwigoweb',
      init: this.getShellCommandsForPiwigo(),
      blockDevices: [
        {
          deviceName: '/dev/sdh',
          volume: BlockDeviceVolume.ebs(Size.gibibytes(200).toGibibytes(), {
            volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD
          })
        }
      ],
      vpcSubnets: {
        subnetGroupName: ec2SubnetName
      },
      keyName: this.getSshKeyName().valueAsString
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
          name: ec2SubnetName,
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name: databaseSubnetName,
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28
        },
        {
          name: 'natSubnet',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
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

  private getSshKeyName() {
    return new CfnParameter(this, 'keyname', {
      type: "String",
      description: "Keyname for accesing trough the instance trough SSH"
    });
  }
}