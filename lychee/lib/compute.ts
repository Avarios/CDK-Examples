import {
    Vpc,  Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType, AmazonLinuxGeneration, InitCommand, CloudFormationInit
} from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Size,Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ComputeProps {
    Vpc: Vpc,
    InstanceSecurityGroup: SecurityGroup,
    InstanceSubnetGroupName: string,
    InstanceSshKeyName: string
}

export class Compute extends Construct {

    public readonly WebServer: Instance;

    constructor(parent: Stack, id: string, props: ComputeProps) {
        super(parent, id);

        this.WebServer = new Instance(this, 'lycheeInstance', {
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM),
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            vpc: props.Vpc,
            instanceName: 'lycheeDocker',
            init: this.getShellCommands(),
            blockDevices: [
                {
                    deviceName: '/dev/sda1',
                    volume: BlockDeviceVolume.ebs(Size.gibibytes(400).toGibibytes(), {
                        volumeType: EbsDeviceVolumeType.GP3
                    })
                }
            ],
            vpcSubnets: {
                subnetGroupName: props.InstanceSubnetGroupName
            },
            securityGroup: props.InstanceSecurityGroup,
            keyName: props.InstanceSshKeyName
        });
        this.WebServer.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    }

    private getShellCommands(): CloudFormationInit {
        return CloudFormationInit.fromElements(
            InitCommand.shellCommand('sudo yum update -y'),
            InitCommand.shellCommand('sudo yum install docker -y'),
            InitCommand.shellCommand('sudo wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)'),
            InitCommand.shellCommand('sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose'),
            InitCommand.shellCommand('sudo chmod -v +x /usr/local/bin/docker-compose'),
            InitCommand.shellCommand('sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose'),
            InitCommand.shellCommand('sudo systemctl enable docker.service'),
            InitCommand.shellCommand('sudo systemctl start docker.service'),
            InitCommand.shellCommand('sudo wget https://raw.githubusercontent.com/Ahrimaan/CDK-Examples/main/lychee/res/docker-compose.yaml -P /home/ec2-user/'),
            InitCommand.shellCommand('sudo mkfs -t xfs /dev/sda1'),
            InitCommand.shellCommand('sudo mkdir /home/ec2-user/lycheedata'),
            InitCommand.shellCommand('sudo mount /dev/sda1 /home/ec2-user/lycheedata'),
            InitCommand.shellCommand('sudo docker-compose -f /home/ec2-user/docker-compose.yaml up -d')
        )
    }
}