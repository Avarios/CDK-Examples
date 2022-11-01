import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseClusterEngine,
  ServerlessCluster,
  DatabaseCluster,
} from "aws-cdk-lib/aws-rds";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";

export class DatabaseStack extends Construct {
  constructor(
    parent: Stack,
    id: string,
    vpc: Vpc,
    dbSecurityGroup: SecurityGroup
  ) {
    super(parent, id);

    const standardCluster = new DatabaseCluster(this,'dbCluster', {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_08_3
      }),
      instanceProps: {
        vpc,
        instanceType: InstanceType.of(InstanceClass.T3,InstanceSize.SMALL),
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        publiclyAccessible: false
      },
      credentials: Credentials.fromGeneratedSecret("piwigoadmin", {
        secretName: "piwigo",
        excludeCharacters:',%&$§"{[]}/'
      }),
      defaultDatabaseName: "piwigo",
      removalPolicy:RemovalPolicy.DESTROY
    })

    new CfnOutput(this, "dbSecret", {
      value: `https://${parent.region}.console.aws.amazon.com/secretsmanager/secret?name=${standardCluster.secret?.secretName}&region=${parent.region}`,
      description: "The Database Secret in SecretsManager",
      exportName: "dbSecret",
    });

    new CfnOutput(this, "databaseDns", {
      value: standardCluster.clusterEndpoint.hostname,
      description: "The Database hostname",
      exportName: "dbHost",
    });
  }
}
