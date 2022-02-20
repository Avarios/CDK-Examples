#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PiwigoInfraStack } from '../lib/piwigo_infra-stack';
import { Database } from '../lib/database-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';


const app = new cdk.App();
let piwigoStack = new PiwigoInfraStack(app, 'PiwigoInfraStack');
let networkStack = new NetworkStack(piwigoStack, 'piwigo-network');
let securityGroupStack = new SecurityGroups(piwigoStack, 'pwiwigo-sg', networkStack.DefaultVpc);
let compute = new Compute(piwigoStack, 'piwigo-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: piwigoStack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
let loadBalancer = new LoadBalancer(piwigoStack, 'piwigo-loadbalancer', {
  CertificateArn: piwigoStack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});
let database = new Database(piwigoStack, 'piwigo-db', {
  accessingEc2: compute.WebServer,
  ec2Role: compute.WebServer.role,
  rdsSecurityGroup: securityGroupStack.DatabaseSecurityGroup,
  subnetGroupName: networkStack.DatabaseSubnetName,
  vpc: networkStack.DefaultVpc
})

