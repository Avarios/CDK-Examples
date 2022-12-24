import { Stack } from "aws-cdk-lib";
import { Vpc, SubnetType, Subnet, PrivateSubnet } from "aws-cdk-lib/aws-ec2";
import { SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export class NetworkStack extends Construct {
  public readonly DefaultVpc: Vpc;
  public readonly DbSubnet : Subnet;
  public readonly WebserverSubnetName = "lycheeWebServerSubnet";
  public readonly DbSubnetName = 'lycheeDBSubnet';

  constructor(parent: Stack, id: string) {
    super(parent, id);
    this.DefaultVpc = new Vpc(parent, "lycheevpc", {
      cidr: "10.0.0.0/16",
      natGateways: 1,
      subnetConfiguration: [
        {
          name: this.WebserverSubnetName,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
            name:this.DbSubnetName,
            subnetType: SubnetType.PRIVATE_ISOLATED,
            cidrMask:24
        },
        {
          name: "lycheeNAT",
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28,
        },
      ],
      maxAzs: 2
    });
  }
}
