import { Stack, Construct, RemovalPolicy, CfnOutput } from '@aws-cdk/core';
import { Vpc, SecurityGroup, Instance, InstanceType, InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, Credentials } from '@aws-cdk/aws-rds';
import { IRole, PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export interface DatabaseProps {
  vpc: Vpc;
  ec2Role: IRole;
  rdsSecurityGroup: SecurityGroup;
  subnetGroupName: string;
  accessingEc2: Instance
}

export class Database extends Construct {
  constructor(parent: Stack, name: string, props: DatabaseProps) {
    super(parent, name);

    const databaseUsername = 'piwigo-admin';

    // Database Credentials
    const databaseCredentialsSecret = new Secret(this, 'DBCredentialsSecret', {
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

    const statement = new PolicyStatement({
      principals: [props.ec2Role],
      actions: ["secretsmanager:GetSecretValue"],
      resources: ["*"],
      effect: Effect.ALLOW
    })
    databaseCredentialsSecret.addToResourcePolicy(statement)

    new StringParameter(this, 'DBCredentialsArn', {
      parameterName: 'rds-credentials-arn',
      stringValue: databaseCredentialsSecret.secretArn,
    });

    // Database
    const rdsInstance = new DatabaseInstance(this, 'piwigo-database', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_26
      }),
      multiAz: true,
      credentials: Credentials.fromSecret(databaseCredentialsSecret),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
      vpc: props.vpc,
      vpcSubnets: { subnetGroupName: props.subnetGroupName },
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [props.rdsSecurityGroup],
      instanceIdentifier: "piwigo-database"
    });

    let databaseDNS = new CfnOutput(this, 'dbDns', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'The Database DNS Name',
      exportName: 'dbDNS'
    });

    let databaseName = new CfnOutput(this, 'dbName', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'The Database DNS Name',
      exportName: 'dbDNS'
    });

    let secretValue = new CfnOutput(this, 'secretValue', {
      value: databaseCredentialsSecret.secretValue.toString(),
      description: 'The Database Password',
      exportName: 'dbPassword'
    });

    databaseCredentialsSecret.secretValue
    databaseCredentialsSecret.grantRead(props.accessingEc2);
    rdsInstance.grantConnect(props.accessingEc2);
  }
}