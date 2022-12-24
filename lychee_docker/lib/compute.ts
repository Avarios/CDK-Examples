import { Stack, Size } from "aws-cdk-lib";
import {
  Vpc,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  MachineImage,
  SecurityGroup,
  BlockDeviceVolume,
  EbsDeviceVolumeType,
  AmazonLinuxGeneration,
  AmazonLinuxCpuType,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";

export interface ComputeProps {
  Vpc: Vpc;
  InstanceSecurityGroup: SecurityGroup;
  InstanceSubnetGroupName: string;
  InstanceSshKeyName: string;
}

export class Compute extends Construct {
  public readonly WebServer: Instance;

  constructor(parent: Stack, id: string, props: ComputeProps) {
    super(parent, id);

    this.WebServer = new Instance(this, "lycheeec2", {
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.SMALL
      ),
      machineImage: MachineImage.latestAmazonLinux({
        cpuType: AmazonLinuxCpuType.ARM_64,
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: props.Vpc,
      instanceName: "lycheeweb",
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: BlockDeviceVolume.ebs(Size.gibibytes(210).toGibibytes(), {
            volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
          }),
        },
      ],
      vpcSubnets: {
        subnetGroupName: props.InstanceSubnetGroupName,
      },
      securityGroup: props.InstanceSecurityGroup,
      keyName: props.InstanceSshKeyName,
    });
    this.WebServer.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    const userDataCommands = [
      "export PATH=/usr/local/bin:$PATH;",
      "yum update -y",
      "yum install docker -y",
      "curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose",
      "chmod -v +x /usr/local/bin/docker-compose",
      "ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose",
      "chown root:docker /usr/local/bin/docker-compose",
      "systemctl enable docker.service",
      "systemctl start docker.service",
      "wget https://raw.githubusercontent.com/Avarios/CDK-Examples/main/lycheeEC2HostedDocker/res/docker-compose.yaml -P /home/ec2-user/",
      "mkdir /home/ec2-user/lychee",
      "chmod 777 /home/ec2-user/lychee",
      "docker-compose -f /home/ec2-user/docker-compose.yaml up -d",
    ];

    this.WebServer.addUserData(...userDataCommands);
  }
}
