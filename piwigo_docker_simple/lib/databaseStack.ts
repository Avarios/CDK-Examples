import { CfnOutput, Stack } from "aws-cdk-lib";
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
    dbSecurityGroup: SecurityGroup,
    isServerless:boolean
  ) {
    super(parent, id);

    //TODO: Add Switch for Serverless vs standard
    if(isServerless) {
      const serverlessCluster = new ServerlessCluster(this, "dbCluster", {
        engine: DatabaseClusterEngine.auroraMysql({
          version: AuroraMysqlEngineVersion.VER_2_08_3
        }),
        credentials: Credentials.fromGeneratedSecret("piwigoadmin", {
          secretName: "piwigo",
          excludeCharacters:',%&$§"'
        }),
        vpc,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        defaultDatabaseName: "piwigo",
        securityGroups: [dbSecurityGroup],
        scaling: {
          maxCapacity:1
        }
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
    else{
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
        },
        credentials: Credentials.fromGeneratedSecret("piwigoadmin", {
          secretName: "piwigo",
          excludeCharacters:',%&$§"'
        }),
        defaultDatabaseName: "piwigo",
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
}
