import { Stack } from 'aws-cdk-lib';
import { Peer, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class SecurityGroups extends Construct {

    public readonly AlbSecurityGroup: SecurityGroup;
    public readonly InstanceSecurityGroup: SecurityGroup;

    constructor(parent: Stack, id: string, vpc: Vpc) {
        super(parent, id);

        this.AlbSecurityGroup = new SecurityGroup(parent, 'alb-securitygrp', {
            vpc,
            allowAllOutbound: true
        });
        this.AlbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Inbound Traffic from anywhere to ALB');
        this.InstanceSecurityGroup = new SecurityGroup(parent, 'webserver-securitygrp', {
            vpc,
            allowAllOutbound: true
        });
        this.InstanceSecurityGroup.addIngressRule(this.AlbSecurityGroup, Port.tcp(80), 'Allow Port 80 from ALB to Instance');
    }
}
