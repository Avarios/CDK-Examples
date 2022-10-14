import { Stack, Size } from 'aws-cdk-lib/core';
import {
    Vpc,  Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType, AmazonLinuxGeneration, InitCommand, CloudFormationInit
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';


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
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM),
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            vpc: props.Vpc,
            instanceName: 'piwigoweb',
            blockDevices: [
                {
                    deviceName: '/dev/sdh',
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

        let userdata = readFileSync('../res/startup.sh','utf-8');
        this.WebServer.addUserData(userdata);
    }
}