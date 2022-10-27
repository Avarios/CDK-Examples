import { App } from 'aws-cdk-lib'
import { PiwigoInfraStack } from '../lib/piwigo_infra-stack';
import { Compute } from '../lib/compute';
import { LoadBalancer } from '../lib/loadBalancer';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';
import { DatabaseStack } from '../lib/databaseStack';


const app = new App();
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
let db = new DatabaseStack(piwigoStack,'piwigo-databaseStack',networkStack.DefaultVpc,securityGroupStack.DatabaseSecurityGroup, piwigoStack.IsDbServerless);

