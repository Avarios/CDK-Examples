#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LycheeStack } from '../lib/lychee-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';


const app = new cdk.App();
let piwigoStack = new LycheeStack(app, 'lycheeInfraStack');
let networkStack = new NetworkStack(piwigoStack, 'lychee-network');
let securityGroupStack = new SecurityGroups(piwigoStack, 'lychee-sg', networkStack.DefaultVpc);
let compute = new Compute(piwigoStack, 'lychee-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: piwigoStack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
let loadBalancer = new LoadBalancer(piwigoStack, 'lychee-loadbalancer', {
  CertificateArn: piwigoStack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});

