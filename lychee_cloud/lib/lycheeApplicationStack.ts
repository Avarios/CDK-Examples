import { Stack, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FargateService,TaskDefinition } from 'aws-cdk-lib/aws-ecs';

export class LycheeApplicationStack extends Construct {
  /**
   *
   */
  constructor(parent:Stack,id:string) {
    super(parent,id);
    
  }
}