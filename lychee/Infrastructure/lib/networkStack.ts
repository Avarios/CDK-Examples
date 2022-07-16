import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Construct {

  public readonly DefaultVpc: Vpc;
  public readonly WebserverSubnetName = 'lycheeWeb';
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
