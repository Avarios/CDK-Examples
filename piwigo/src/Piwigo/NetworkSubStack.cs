using Amazon.CDK;
using Amazon.CDK.AWS.EC2;

namespace Piwigo
{
    internal class NetworkSubStack : NestedStack
    {
        const string DATABASE_SUBNET_NAME = "dbSubnet";
        const string SERVER_SUBNET_NAME = "serverSubnet";
        const string ALB_SUBNET_NAME = "albSubnet";

        public NetworkSubStack(Constructs.Construct scope, string id, INestedStackProps props = null) : base(scope, id, props)
        { 
            var vpc = new Vpc(scope, "piwigo-vpc", new VpcProps()
            {
                SubnetConfiguration = new[]
                {
                    new SubnetConfiguration()
                    {
                        CidrMask = 28,
                        Name = DATABASE_SUBNET_NAME,
                        SubnetType = SubnetType.PRIVATE
                    },
                    new SubnetConfiguration()
                    {
                        CidrMask = 28,
                        Name = ALB_SUBNET_NAME,
                        SubnetType = SubnetType.PUBLIC
                    },
                    new SubnetConfiguration()
                    {
                        CidrMask = 24,
                        Name = SERVER_SUBNET_NAME,
                        SubnetType = SubnetType.PRIVATE
                    },
                },
                NatGatewaySubnets = new SubnetSelection()
                {
                    SubnetGroupName = SERVER_SUBNET_NAME
                },
                NatGateways = 1
            });

            var albSg = new SecurityGroup(scope, "alb-sg", new SecurityGroupProps() { Vpc = vpc });
            var dbSg = new SecurityGroup(scope, "db-sg", new SecurityGroupProps() { Vpc = vpc });
            var serverSg = new SecurityGroup(scope, "server-sg", new SecurityGroupProps() { Vpc = vpc });

            serverSg.AddIngressRule(albSg, Port.Tcp(80));
            albSg.AddIngressRule(Peer.AnyIpv4(), Port.Tcp(443));
            dbSg.AddIngressRule(serverSg, Port.Tcp(3306));
        }
    }
}
