using Amazon.CDK;
using Amazon.CDK.AWS.EC2;

namespace Piwigo
{
    public class NetworkStackParameter
    {
        /// <summary>
        /// The VPC the ALB resides in
        /// </summary>
        public Vpc Vpc { get; private set; }

        /// <summary>
        /// Security Group with all Ingress/Egress Rules for the ALB
        /// </summary>
        public SecurityGroup SecurityGroupLoadBalancer { get; private set; }

        /// <summary>
        /// The VPC SubnetGroup Name for the ALB to be hosted in
        /// </summary>
        public string LoadBalancerSubnetGroupName { get; private set; }

        /// <summary>
        /// The Server Instance where the Traffic from ALB is routed to
        /// </summary>
        public SecurityGroup InstanceSecurityGroup { get; private set; }

        public NetworkStackParameter(Vpc vpc,SecurityGroup loadBalancerSecurityGroup,string loadbalancerSubnetGroupName, SecurityGroup instanceSecurityGroup)
        {
            this.Vpc = vpc;
            this.SecurityGroupLoadBalancer = loadBalancerSecurityGroup;
            this.LoadBalancerSubnetGroupName = loadbalancerSubnetGroupName;
            this.InstanceSecurityGroup = instanceSecurityGroup;
        }
    }


    public class NetworkStack : NestedStack
    {
        const string DATABASE_SUBNET_NAME = "dbSubnet";
        const string SERVER_SUBNET_NAME = "serverSubnet";
        const string ALB_SUBNET_NAME = "albSubnet";

        public NetworkStackParameter OutputParameters { get; private set; }


        public NetworkStack(Constructs.Construct scope, string id, INestedStackProps props = null) : base(scope, id, props)
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

            //Add all the Parameters defined here and export it
            this.OutputParameters = new NetworkStackParameter(vpc, albSg, ALB_SUBNET_NAME, serverSg);

        }
    }
}
