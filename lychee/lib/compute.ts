import { Stack, Construct } from '@aws-cdk/core';
import {
    Vpc,  Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType, AmazonLinuxGeneration, InitCommand, CloudFormationInit
} from '@aws-cdk/aws-ec2';
import { Size } from '@aws-cdk/core';

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
            init: this.getShellCommandsForPiwigo(),
            blockDevices: [
                {
                    deviceName: '/dev/sda1',
                    volume: BlockDeviceVolume.ebs(Size.gibibytes(400).toGibibytes(), {
                        volumeType: EbsDeviceVolumeType.GP3,
                        iops:3000
                    })
                }
            ],
            vpcSubnets: {
                subnetGroupName: props.InstanceSubnetGroupName
            },
            securityGroup: props.InstanceSecurityGroup,
            keyName: props.InstanceSshKeyName
        });
    }

    private getShellCommandsForPiwigo(): CloudFormationInit {
        return CloudFormationInit.fromElements(
            InitCommand.shellCommand('sudo yum update -y'),
            InitCommand.shellCommand('sudo yum install docker -y'),
            InitCommand.shellCommand('sudo pip install docker-compose'),
            InitCommand.shellCommand('sudo systemctl enable docker.service'),
            InitCommand.shellCommand('sudo systemctl start docker.service'),
            InitCommand.shellCommand('sudo mkdir lychee'),
            InitCommand.shellCommand('cd lychee'),
            InitCommand.shellCommand('wget https://github.com/Ahrimaan/CDK-Examples/blob/main/lychee/res/docker-compose.yaml'),
            InitCommand.shellCommand('sudo docker-compose up -d')
        )
    }
}