import { App } from 'aws-cdk-lib'
import { PiwigoInfraStack } from '../lib/piwigo_infra-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';

const app = new App();
const piwigoStack = new PiwigoInfraStack(app, 'PiwigoInfraStack');
const networkStack = new NetworkStack(piwigoStack, 'piwigo-network');
const securityGroupStack = new SecurityGroups(piwigoStack, 'pwiwigo-sg', networkStack.DefaultVpc);
const compute = new Compute(piwigoStack, 'piwigo-compute', {
  InstanceSecurityGroup: securityGroupStack.InstanceSecurityGroup,
  InstanceSshKeyName: piwigoStack.SshKeyName,
  InstanceSubnetGroupName: networkStack.WebserverSubnetName,
  Vpc: networkStack.DefaultVpc
});
const loadBalancer = new LoadBalancer(piwigoStack, 'piwigo-loadbalancer', {
  CertificateArn: piwigoStack.CertificateArn,
  LoadBalancerSecurityGroup: securityGroupStack.AlbSecurityGroup,
  TargetInstance: compute.WebServer,
  Vpc: networkStack.DefaultVpc
});

