import * as cdk from '@aws-cdk/core';
import {
    Vpc, SubnetType, Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType, AmazonLinuxGeneration, CloudFormationInit, InitCommand
} from '@aws-cdk/aws-ec2';
import { Size } from '@aws-cdk/core';

export class Compute extends cdk.Construct {

    public readonly WebServer: Instance;
    constructor(scope: cdk.Construct, id: string, vpc: Vpc, securityGroup: SecurityGroup, subnetGroupName: string, sshKeyName: string) {
        super(scope, id);

        this.WebServer = new Instance(this, 'piwigoec2', {
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM),
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            securityGroup: securityGroup,
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
                subnetGroupName: subnetGroupName
            },
            keyName: sshKeyName
        });
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
}