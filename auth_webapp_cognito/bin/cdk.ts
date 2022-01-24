#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { Authentication } from '../lib/authentication';

const app = new cdk.App();
const stack = new InfrastructureStack(app, 'AuthenticationDemoStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

let network = new NetworkStack(stack, 'AuthWebApp');
let securityGroups = new SecurityGroups(stack, 'AuthSecurityGroups', network.DefaultVpc);
let webserver = new Compute(stack, 'AuthWebserver', network.DefaultVpc, securityGroups.InstanceSecurityGroup,
    network.InstanceSubnetGroupName).WebServer
let alb = new LoadBalancer(stack, 'AuthLoadBalancer', {
    LoadBalancerSecurityGroup: securityGroups.AlbSecurityGroup,
    Vpc: network.DefaultVpc, TargetInstance: webserver
});
let cognito = new Authentication(stack, 'AuthCognito', alb.LoadBalancerDnsName);
alb.AddCognitoListener(cognito.UserPool, cognito.UserPoolClient, cognito.UserPoolDomain);
