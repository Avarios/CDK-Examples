import * as cdk from 'aws-cdk-lib';
import { IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { config } from './parameters';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthenticationLoadbalancerExistingressourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AuthenticationLoadbalancerExistingressourcesQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
