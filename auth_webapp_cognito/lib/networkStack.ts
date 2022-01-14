import * as cdk from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

export class NetworkStack extends cdk.Construct {

  public readonly DefaultVpc: Vpc;
  public readonly InstanceSubnetGroupName: string;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    this.InstanceSubnetGroupName = 'webserverSubnet'
    this.DefaultVpc = new Vpc(this, 'piwigovpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: this.InstanceSubnetGroupName,
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name: 'albSubnet',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
        }
      ],
      maxAzs: 2
    });

  }
}
