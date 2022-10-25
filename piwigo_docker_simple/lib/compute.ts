import { Stack, Size } from 'aws-cdk-lib';
import {
    Vpc,  Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType, AmazonLinuxGeneration, InitCommand, CloudFormationInit, AmazonLinuxCpuType
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import * as path from 'path';

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

        this.WebServer = new Instance(this, 'piwigoec2', {
            instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.SMALL),
            machineImage: MachineImage.latestAmazonLinux(
                {
                    cpuType: AmazonLinuxCpuType.ARM_64,
                    generation:AmazonLinuxGeneration.AMAZON_LINUX_2
                }
            ),
            vpc: props.Vpc,
            instanceName: 'piwigoweb',
            blockDevices: [
                {
                    deviceName: '/dev/xvda',
                    volume: BlockDeviceVolume.ebs(Size.gibibytes(200).toGibibytes(), {
                        volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD
                    })
                }
            ],
            vpcSubnets: {
                subnetGroupName: props.InstanceSubnetGroupName
            },
            securityGroup: props.InstanceSecurityGroup,
            keyName: props.InstanceSshKeyName
        });
        this.WebServer.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore') )

        let userdata = readFileSync(path.resolve(path.join(__dirname, '../res/startup.sh')),'utf-8');
        this.WebServer.addUserData(userdata);
    }
}