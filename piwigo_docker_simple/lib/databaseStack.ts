import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseClusterEngine,
  ServerlessCluster,
} from "aws-cdk-lib/aws-rds";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export class DatabaseStack extends Construct {
  constructor(
    parent: Stack,
    id: string,
    vpc: Vpc,
    dbSecurityGroup: SecurityGroup
  ) {
    super(parent, id);

    const dbCluster = new ServerlessCluster(this, "dbCluster", {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_08_3
      }),
      credentials: Credentials.fromGeneratedSecret("piwigoadmin", {
        secretName: "piwigo",
      }),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      defaultDatabaseName: "piwigo",
      securityGroups: [dbSecurityGroup],
    });

    new CfnOutput(this, "dbSecret", {
      value: dbCluster.secret?.secretValue.toString() ?? "NoSecret",
      description: "The Database Secret for username piwigoadmin",
      exportName: "dbSecret",
    });
  }
}
