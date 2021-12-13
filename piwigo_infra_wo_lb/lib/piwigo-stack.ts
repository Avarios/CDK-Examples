import { Stack, StackProps, Construct, CfnParameter, Size, CfnOutput } from '@aws-cdk/core';
import {
  Vpc, SubnetType, SecurityGroup, Port, Peer, Instance, InstanceType, InstanceClass,
  InstanceSize, MachineImage, BlockDeviceVolume, EbsDeviceVolumeType, IPeer, Subnet, AmazonLinuxEdition, AmazonLinuxGeneration, CloudFormationInit, InitCommand
} from '@aws-cdk/aws-ec2';
import { readFileSync } from 'fs';

export class PiwigoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //Creates a VPC
    let vpc = this.createVpc();

    // Security Group for the EC Instance
    // Allow Traffic from anywhere on Port 80
    // Allow Traffic from anywhere on Port SSH
    let piwigoSecurityGroup = this.createSecurityGroup(vpc, 'piwigo-sg', true,
      [
        { Peer: Peer.anyIpv4(), Port: Port.tcp(80) },
        { Peer: Peer.anyIpv4(), Port: Port.tcp(22) }
      ]);

    let piwigoEc2 = this.createEc2Instance(vpc, piwigoSecurityGroup, SubnetType.PUBLIC);

    let publicUrl = new CfnOutput(this, 'piwigoUrl', {
      value: `http://${piwigoEc2.instancePublicIp}/netinstall.php`,
      description: 'The URL of our instance',
      exportName: 'piwigoUrl'
    })
  }

  private getShellCommandsForPiwigo():CloudFormationInit {
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

  private createEc2Instance(vpc: Vpc, defaultSecurityGroup?: SecurityGroup, placing?: SubnetType): Instance {
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
        subnetType: placing ?? SubnetType.PUBLIC
      },
      keyName: this.getSshKeyName().valueAsString
    });

    if (defaultSecurityGroup) {
      instance.addSecurityGroup(defaultSecurityGroup);
    }

    return instance;
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
          name: 'piwigoweb',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
        },
        {
          name: 'databaseSubnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28
        }
      ],
      maxAzs: 1
    });
  }

  private getSshKeyName() {
    return new CfnParameter(this, 'keyname', {
      type: "String",
      description: "Keyname for accesing trough the instance trough SSH"
    });
  }
}
