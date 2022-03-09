import * as cdk from '@aws-cdk/core';
import { Peer, Port, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';

export class SecurityGroups extends cdk.Construct {

    public readonly DatabaseSecurityGroup: SecurityGroup;
    public readonly ApplicationSecurityGroup: SecurityGroup;
    public readonly LambdaSecurityGroup: SecurityGroup;

    constructor(scope: cdk.Construct, id: string, vpc: Vpc) {
        super(scope, id);

        let lambdaSg = new SecurityGroup(this, 'lambdasecgrp', {
            vpc,
            securityGroupName: 'lambda-security-grp'
        });
        let appSg = new SecurityGroup(this, 'applicationsecgrp', {
            vpc: vpc,
            allowAllOutbound: true,
        });

        let dbSg = new SecurityGroup(this, 'dbsecgrp', {
            vpc: vpc,
            allowAllOutbound: false
        });

        appSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80),
            'Inbound Traffic from anywhere to ALB');
        appSg.addIngressRule(lambdaSg, Port.tcp(80),
            'Inbound Traffic from lambda');
        dbSg.addIngressRule(appSg, Port.tcp(80),
            'Allow Port 80 from Application to Database');
        dbSg.addIngressRule(lambdaSg, Port.tcp(80),
            'Allow Port 80 from lambda to db');

        this.ApplicationSecurityGroup = appSg;
        this.DatabaseSecurityGroup = dbSg;
        this.LambdaSecurityGroup = lambdaSg;
    }
}
