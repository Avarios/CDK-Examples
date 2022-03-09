import { Stack, Construct } from '@aws-cdk/core';
import {
    Vpc,  Instance, InstanceType, InstanceClass, InstanceSize, MachineImage,
    SecurityGroup, AmazonLinuxGeneration, InitCommand, CloudFormationInit
} from '@aws-cdk/aws-ec2';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export interface ComputeProps {
    Vpc: Vpc,
    ApplicationSecurityGroup: SecurityGroup,
    DbSecurityGroup: SecurityGroup,
    ApplicationSubnetGroupName: string,
    DbSubnetGroupName: string
}

export class Compute extends Construct {

    public readonly WebServerInstance: Instance;
    public readonly DatabaseServerInstance: Instance;

    constructor(parent: Stack, id: string, props: ComputeProps) {
        super(parent, id);

        // Declare instance 
        this.WebServerInstance = new Instance(this, 'applicationserver', {
            // Instance Size and Machine Image
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            vpc: props.Vpc,
            instanceName: 'appserver',
            init: this.executeShellCommands(),
            vpcSubnets: {
                subnetGroupName: props.ApplicationSubnetGroupName
            },
            securityGroup: props.ApplicationSecurityGroup
        });
        this.WebServerInstance.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

        this.DatabaseServerInstance = new Instance(this, 'dbServer', {
            // Instance Size and Machine Image
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            vpc: props.Vpc,
            instanceName: 'dbServer',
            init: this.executeShellCommands(),
            vpcSubnets: {
                subnetGroupName: props.DbSubnetGroupName
            },
            securityGroup: props.DbSecurityGroup
        });
        this.WebServerInstance.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    }

    private executeShellCommands(): CloudFormationInit {
        return CloudFormationInit.fromElements(
            InitCommand.shellCommand('sudo yum update -y'),
            InitCommand.shellCommand('sudo yum install -y httpd'),
            InitCommand.shellCommand('sudo systemctl start httpd'),
            InitCommand.shellCommand('sudo systemctl enable httpd')
        )
    }
}