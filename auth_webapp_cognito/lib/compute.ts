import * as cdk from '@aws-cdk/core';
import {
    Vpc, SubnetType, Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, BlockDeviceVolume, EbsDeviceVolumeType
} from '@aws-cdk/aws-ec2';
import { Size } from '@aws-cdk/core';

export class Compute extends cdk.Construct {

    public readonly WebServer: Instance;
    constructor(scope: cdk.Construct, id: string, vpc: Vpc, securityGroup: SecurityGroup, subnetGroupName: string) {
        super(scope, id);

        this.WebServer = new Instance(this, 'wordpressInstance', {
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM),
            machineImage: MachineImage.genericLinux({ 'eu-central-1': 'ami-0fc8054a036867514' }),
            vpc: vpc,
            allowAllOutbound: true,
            keyName: 'add-key-name-here',
            securityGroup: securityGroup,
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
        });
    }
}