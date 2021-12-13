import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import secrets = require('@aws-cdk/aws-secretsmanager');
import ssm = require('@aws-cdk/aws-ssm');
import rds = require('@aws-cdk/aws-rds');
import iam = require('@aws-cdk/aws-iam');
import { Construct, Stack } from '@aws-cdk/core';

export interface DatabaseProps {
    vpc: ec2.Vpc;
    ec2Role: iam.Role;
    rdsSecurityGroup: ec2.SecurityGroup;
    subnetGroupName: string;
}

export class Database extends Construct {
    constructor(parent: Stack, name: string, props: DatabaseProps) {
        super(parent, name);
        
        const databaseUsername = 'syscdk';
    
        // Database Credentials
        const databaseCredentialsSecret = new secrets.Secret(this, 'DBCredentialsSecret', {
          secretName: 'rds-credentials',
          generateSecretString: {
            secretStringTemplate: JSON.stringify({
              username: databaseUsername,
            }),
            excludePunctuation: true,
            includeSpace: false,
            generateStringKey: 'password',
          }
        });
        
        // iam.PolicyStatement.fromJson("{\
        //   Version : '2012-10-17',\
        //   Statement : [\
        //     {
        //       "Effect": "Allow",
        //       "Principal": {"AWS": "arn:aws:iam::123456789012:role/EC2RoleToAccessSecrets"},
        //       "Action": "secretsmanager:GetSecretValue",
        //       "Resource": "*",
        //       "Condition": {
        //         "ForAnyValue:StringEquals": {
        //           "secretsmanager:VersionStage" : "AWSCURRENT"
        //         }
        //       }
        //     }
        //   ]
        // }")
        
        const statement = new iam.PolicyStatement({
          principals: [props.ec2Role],
          actions: ["secretsmanager:GetSecretValue"],
          resources: ["*"],
          effect: iam.Effect.ALLOW
        })
        databaseCredentialsSecret.addToResourcePolicy(statement)
        
        new ssm.StringParameter(this, 'DBCredentialsArn', {
          parameterName: 'rds-credentials-arn',
          stringValue: databaseCredentialsSecret.secretArn,
        });
      
        // Database
        const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
          engine: rds.DatabaseInstanceEngine.mysql({
            version: rds.MysqlEngineVersion.VER_5_7_30
          }),
          multiAz: true,
          credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
          vpc: props.vpc,
          vpcSubnets: { subnetGroupName: props.subnetGroupName },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          deletionProtection: false,
          securityGroups: [props.rdsSecurityGroup],
          instanceIdentifier:"three-tiered-web-app-database"
        });
        
        //const rdsInstanceReplication = new rds.DatabaseInstanceReadReplica(this, 'DBInstanceReplication', {
        //  sourceDatabaseInstance: rdsInstance,
        //  instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        //  vpc: vpc,
        //  vpcSubnets: { onePerAz: true, subnetGroupName: "database" },
        //  removalPolicy: cdk.RemovalPolicy.DESTROY,
        //  deletionProtection: false,
        //  securityGroups: [dbConnectionGroup]
        //});
        
        //databaseCredentialsSecret.grantRead(rdsLambda); // TODO: HIER MUSS WAHRSCHEINLICH DIE EC2 INSTANZ REIN!
    }
}