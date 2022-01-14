import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NetworkStack } from '../lib/networkStack';
import { LoadBalancer } from '../lib/loadBalancer';
import { SecurityGroups } from '../lib/securityGroups';
import { Compute } from '../lib/compute';

const app = new cdk.App();
let network = new NetworkStack(app, 'AuthWebApp');
let securityGroups = new SecurityGroups(app, 'AuthSecurityGroups', network.DefaultVpc);
let webserver = new Compute(app, 'webserver', network.DefaultVpc, securityGroups.InstanceSecurityGroup,
    network.InstanceSubnetGroupName).WebServer
new LoadBalancer(app, 'AuthLoadBalancer', {
    LoadBalancerSecurityGroup: securityGroups.AlbSecurityGroup,
    Vpc: network.DefaultVpc, TargetInstance: webserver
});
