import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseClusterEngine,
  ServerlessCluster,
  DatabaseCluster
} from "aws-cdk-lib/aws-rds";
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export class DatabaseStack extends Construct {
  constructor(
    parent: Stack,
    id: string,
    vpc: Vpc,
    dbSecurityGroup: SecurityGroup
  ) {
    super(parent, id);

    const serverlessCluster = new ServerlessCluster(this, "dbCluster", {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_08_3
      }),
      credentials: Credentials.fromGeneratedSecret("piwigoadmin", {
        secretName: "piwigo",
        excludeCharacters:',%&$§"{[]}/'
      }),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      defaultDatabaseName: "piwigo",
      securityGroups: [dbSecurityGroup],
      scaling: {
        maxCapacity:1
      },
      removalPolicy: RemovalPolicy.DESTROY
    });

    new CfnOutput(this, "dbSecret", {
      value: `https://${parent.region}.console.aws.amazon.com/secretsmanager/secret?name=${serverlessCluster.secret?.secretName}&region=${parent.region}`,
      description: "The Database Secret in SecretsManager",
      exportName: "dbSecret",
    });

    new CfnOutput(this, "databaseDns", {
      value: serverlessCluster.clusterEndpoint.hostname,
      description: "The Database hostname",
      exportName: "dbHost",
    });
  }
}
