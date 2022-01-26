#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';
import { Compute } from '../lib/compute';
import { AuthenticationLoadBalancer } from '../lib/authenticationLoadBalancer';

const app = new cdk.App();
const stack = new InfrastructureStack(app, 'AuthenticationDemoStack', {

});

let network = new NetworkStack(stack, 'AuthWebApp');
let securityGroups = new SecurityGroups(stack, 'AuthSecurityGroups', network.DefaultVpc);
let webserver = new Compute(stack, 'AuthWebserver', network.DefaultVpc, securityGroups.InstanceSecurityGroup,
  network.InstanceSubnetGroupName, stack.SshKeyName).WebServer
new AuthenticationLoadBalancer(stack, 'AuthLoadBalancer', {
  LoadBalancerSecurityGroup: securityGroups.AlbSecurityGroup,
  Vpc: network.DefaultVpc, TargetInstance: webserver,
  ReplyMailAdress: stack.ReplyMail,
  certificateArn: stack.CertificateArn
});
