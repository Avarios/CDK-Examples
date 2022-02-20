import {Stack,Construct} from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

export class NetworkStack extends Construct {

  public readonly DefaultVpc: Vpc;
  public readonly WebserverSubnetName = 'PiwigoWebServerSubnet';
  public readonly DatabaseSubnetName = 'PiwigoDBServerSubnet';

  constructor(parent: Stack, id: string) {
    super(parent, id);
    this.DefaultVpc = new Vpc(this, 'piwigovpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: this.WebserverSubnetName,
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name: this.DatabaseSubnetName,
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28
        },
        {
          name: 'PiwigoNAT',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
        }
      ],
      maxAzs: 2
    });

  }
}
