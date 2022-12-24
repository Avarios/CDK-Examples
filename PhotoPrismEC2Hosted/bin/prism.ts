import { App } from 'aws-cdk-lib'
import { InfrastructureStack } from '../lib/piwigo_infra-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';

const app = new App();
const infrastack = new InfrastructureStack(app, 'PrismStack');
const networkStack = new NetworkStack(infrastack, 'prism-network');
const securityGroupStack = new SecurityGroups(infrastack, 'prism-sg', networkStack.DefaultVpc);
const compute = new Compute(infrastack, 'prism-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: infrastack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
const loadBalancer = new LoadBalancer(infrastack, 'prism-loadbalancer', {
  CertificateArn: infrastack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});

