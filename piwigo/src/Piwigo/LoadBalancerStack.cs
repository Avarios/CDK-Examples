using Amazon.CDK;
using Amazon.CDK.AWS.AutoScaling;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ElasticLoadBalancingV2;

namespace Piwigo
{
    public class LoadBalancerProps
    {
        /// <summary>
        /// The VPC the ALB resides in
        /// </summary>
        public Vpc Vpc { get;private set; }

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
        public string AlbTargetIpAdress { get; private set; }
    }

    internal class LoadBalancerStack : NestedStack
    {
        public LoadBalancerStack(Constructs.Construct scope, string id, INestedStackProps props,LoadBalancerProps lbProps) : base(scope, id, props)
        {
            var alb = new ApplicationLoadBalancer(scope, "piwigoLoadBalancer", new ApplicationLoadBalancerProps()
            {
                Vpc = lbProps.Vpc,
                InternetFacing = true,
                SecurityGroup = lbProps.SecurityGroupLoadBalancer,
                VpcSubnets = new SubnetSelection { SubnetGroupName = lbProps.LoadBalancerSubnetGroupName },
                IpAddressType = IpAddressType.IPV4
            });

            var albListener = alb.AddListener("httpsListener", new BaseApplicationListenerProps
            {
                Port = 443,
                Open = true,
                Protocol = ApplicationProtocol.HTTPS,
                Certificates = new []
                {
                    new ListenerCertificate("ADD ARN HERE")
                }
            });

            albListener.AddTargets("targets", new AddApplicationTargetsProps
            {
                Targets = new[] { new IpTarget(lbProps.AlbTargetIpAdress) }
            });
        }
    }
}
