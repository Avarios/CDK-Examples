import {Stack,Construct} from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

export class NetworkStack extends Construct {

  public readonly DefaultVpc: Vpc;
  public readonly WebserverSubnetName = 'lyheeWeb';
  public readonly PublicSubnetName = 'lycheePublic';

  constructor(parent: Stack, id: string) {
    super(parent, id);
    this.DefaultVpc = new Vpc(this, 'lycheeVpc', {
      cidr: '10.0.0.0/26',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: this.WebserverSubnetName,
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 28
        },
        {
          name: this.PublicSubnetName,
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
        }
      ],
      maxAzs: 2
    });

  }
}
