import * as cdk from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

export class NetworkStack extends cdk.Construct {

  public readonly DefaultVpc: Vpc;
  public readonly ApplicationSubnetName: string;
  public readonly DatabaseSubnetName: string;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    let applicationSubnetName = 'applicationnet';
    let databaseSubnetName = 'databasenet';
    let vpc = new Vpc(this, 'schedulervpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      subnetConfiguration: [
        {
          name: databaseSubnetName,
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        },
        {
          name: applicationSubnetName,
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28
        }
      ],
      maxAzs: 1
    });

    this.ApplicationSubnetName = applicationSubnetName;
    this.DatabaseSubnetName = databaseSubnetName;
    this.DefaultVpc = vpc

  }
}
