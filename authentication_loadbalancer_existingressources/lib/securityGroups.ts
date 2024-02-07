import { IVpc, Peer, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs'
import { config } from './parameters';

export class SecurityGroups extends Construct {

    public readonly AlbSecurityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, instanceTargetPort: number, existingSgId: string,vpc:IVpc) {
        super(scope, id);
        this.AlbSecurityGroup = new SecurityGroup(scope, 'alb-securitygrp', {
            vpc: vpc,
            allowAllOutbound: true,
        });
        this.AlbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Inbound Traffic from anywhere to ALB');
        this.AlbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Inbound Traffic from anywhere to ALB');
        let existinginstanceSecurityGroup = SecurityGroup.fromSecurityGroupId(scope, "existingSg", existingSgId);
        existinginstanceSecurityGroup.addIngressRule(this.AlbSecurityGroup, Port.tcp(instanceTargetPort), 'Allow Port xx from ALB to Instance');
    }
}
