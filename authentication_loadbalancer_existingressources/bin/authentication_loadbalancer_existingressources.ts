#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthenticationLoadbalancerExistingressourcesStack } from '../lib/authentication_loadbalancer_existingressources-stack';
import { SecurityGroups } from '../lib/securityGroups';
import { AuthenticationLoadBalancer } from '../lib/authenticationLoadBalancer';
import { config } from '../lib/parameters';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

const app = new cdk.App();
let stack = new AuthenticationLoadbalancerExistingressourcesStack(app, 'AuthenticationLoadbalancerExistingressourcesStack', {
  env: {
    account: config.accountNumber,
    region: config.region
  }
});

let vpc = Vpc.fromLookup(stack, "exisitngVpc", {
  vpcId: config.vpcid
});
let targetInstancePort = config.targetInstancePortNumber;
let securityGroupId = config.existingSecurityGroupId;
let targetInstanceId = config.targetInstanceId;
let certificateArn = config.certificateArn;


let securityGroups = new SecurityGroups(stack, 'AuthSecurityGroups',targetInstancePort, securityGroupId,vpc);
new AuthenticationLoadBalancer(stack, 'AuthLoadBalancer', {
  LoadBalancerSecurityGroup: securityGroups.AlbSecurityGroup,
  certificateArn: certificateArn,
  TargetInstanceId: targetInstanceId,
  TargetInstancePort: targetInstancePort,
  Vpc:vpc
});