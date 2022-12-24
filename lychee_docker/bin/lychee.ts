import { App } from 'aws-cdk-lib'
import { lycheeInfraStack } from '../lib/lycheeStack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';

const app = new App();
const lycheeStack = new lycheeInfraStack(app, 'lycheeInfraStack');
const networkStack = new NetworkStack(lycheeStack, 'lychee-network');
const securityGroupStack = new SecurityGroups(lycheeStack, 'pwiwigo-sg', networkStack.DefaultVpc);
const compute = new Compute(lycheeStack, 'lychee-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: lycheeStack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
const loadBalancer = new LoadBalancer(lycheeStack, 'lychee-loadbalancer', {
  CertificateArn: lycheeStack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});

