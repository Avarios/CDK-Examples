import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    CpuArchitecture, FargateTaskDefinition, OperatingSystemFamily, Scope,
    ContainerImage
}
    from 'aws-cdk-lib/aws-ecs'
import { } from 'aws-cdk-lib/aws-apprunner'; 

//TODO: Add AppRunner instead of ECS
export class ContainerStack extends Construct {
    /**
     *
     */

    constructor(parent: Stack, id: string) {
        super(parent, id);
        const VOLUME_NAME = 'lycheeVolume';

        let lycheeTask = new FargateTaskDefinition(this, 'lycheeWebserverTask', {
            cpu: 4,
            memoryLimitMiB: 4096,
            ephemeralStorageGiB: 10,
            runtimePlatform: {
                cpuArchitecture: CpuArchitecture.X86_64,
                operatingSystemFamily: OperatingSystemFamily.LINUX
            }
        });

        lycheeTask.addVolume({
            name: VOLUME_NAME,
            dockerVolumeConfiguration: {
                autoprovision: true,
                scope: Scope.SHARED,
                driver: 'rexray/ebs',
                driverOpts: {
                    volumetype: 'gp2',
                    size: '100',
                },
            },
        });

        let lycheeContainer = ContainerImage.fromRegistry('lycheeorg/lychee');
        lycheeTask.addContainer('lycheeContainer',
            { 
                image: lycheeContainer,
                cpu: 2,
                memoryLimitMiB:2048,
                //Add Environment for the DB Connection 
            });
    }
}