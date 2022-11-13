import { Stack } from "aws-cdk-lib";
import { Vpc, SubnetType, Subnet, PrivateSubnet } from "aws-cdk-lib/aws-ec2";
import { SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export class NetworkStack extends Construct {
  public readonly DefaultVpc: Vpc;
  public readonly DbSubnet : Subnet;
  public readonly WebserverSubnetName = "PrismHostSubnet";

  constructor(parent: Stack, id: string) {
    super(parent, id);
    this.DefaultVpc = new Vpc(parent, "prismvpc", {
      cidr: "10.0.0.0/16",
      natGateways: 1,
      subnetConfiguration: [
        {
          name: this.WebserverSubnetName,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "PiwigoNAT",
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28,
        },
      ],
      maxAzs: 2
    });
  }
}
