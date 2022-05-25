#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LycheeStack } from '../lib/lychee-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';


const app = new App();
let mainStack = new LycheeStack(app, 'lycheeInfraStack');
let networkStack = new NetworkStack(mainStack, 'lychee-network');
let securityGroupStack = new SecurityGroups(mainStack, 'lychee-sg', networkStack.DefaultVpc);
let compute = new Compute(mainStack, 'lychee-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: mainStack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
let loadBalancer = new LoadBalancer(mainStack, 'lychee-loadbalancer', {
  CertificateArn: mainStack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});

