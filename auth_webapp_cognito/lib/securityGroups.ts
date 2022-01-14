import * as cdk from '@aws-cdk/core';
import { Peer, Port, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';

export class SecurityGroups extends cdk.Construct {

    public readonly AlbSecurityGroup: SecurityGroup;
    public readonly InstanceSecurityGroup: SecurityGroup

    constructor(scope: cdk.Construct, id: string, vpc: Vpc) {
        super(scope, id);

        this.AlbSecurityGroup = new SecurityGroup(this, 'alb-securitygrp', {
            vpc: vpc,
            allowAllOutbound: true,
        });
        this.AlbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Inbound Traffic from anywhere to ALB');
        this.InstanceSecurityGroup = new SecurityGroup(this, 'webserver-securitygrp', {
            vpc: vpc,
            allowAllOutbound: true
        });
        this.InstanceSecurityGroup.addIngressRule(this.AlbSecurityGroup, Port.tcp(80), 'Allow Port 80 from ALB to Instance');
    }
}
