import { CfnOutput, CfnParameter, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Service, Source, VpcConnector, } from '@aws-cdk/aws-apprunner-alpha';
import { Repository, } from 'aws-cdk-lib/aws-ecr';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { IRole, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

interface ContainerStackProps {
    Vpc: Vpc,
    DatabaseHostAdress: string,
    DatabasePort: string
    DatabaseName: string,
    DatabaseUser: string
    DatabaseUserPassword: string
}

export class ContainerStack extends Construct {

    private lycheeWebService: Service;
    private containerRole: IRole

    constructor(parent: Stack, id: string, props: ContainerStackProps) {
        super(parent, id);

        let ecrArn = new CfnParameter(parent, 'ecrarn', {
            description: 'The Arn for the private ECR Repository',
        });

        let imageDigest = new CfnParameter(parent, 'imageDigest', {
            description: 'the digest from ECR'
        });

        this.containerRole = new Role(parent, 'lycheeContainerRole', {
            assumedBy: new ServicePrincipal('tasks.apprunner.amazonaws.com')
        })

        this.lycheeWebService = new Service(parent, 'lycheeWeb', {
            serviceName: 'lycheeWebServer',
            source: Source.fromEcr({
                repository: Repository.fromRepositoryArn(parent, 'lychee_repository', ecrArn.valueAsString),
                tagOrDigest: imageDigest.valueAsString,
                imageConfiguration: {
                    environment: this.imageConfiguration(props.DatabaseHostAdress, props.DatabasePort,
                        props.DatabaseName, props.DatabaseUser, props.DatabaseUserPassword)
                }
            }),
            vpcConnector: new VpcConnector(parent, 'vpcConnector', {
                vpc: props.Vpc,
                vpcSubnets: props.Vpc.selectSubnets({ subnetType: SubnetType.PUBLIC }),
            }),
            instanceRole: this.containerRole,
        });

        new CfnOutput(parent, 'lycheeweburl', {
            value: this.lycheeWebService.serviceUrl,
            description: 'Url to the Lychee Web'
        });
    }

    get LycheeWeb(): Service {
        return this.lycheeWebService;
    }

    get ContainerRole(): IRole {
        return this.ContainerRole;
    }

    private imageConfiguration(databaseHost: string, databasePort: string, databaseName: string,
        databaseUser: string, databaseUserPassword: string): any {
        return {
            'PHP_TZ': 'UTC',
            'TIMEZONE': 'UTC',
            'DB_CONNECTION': 'mysql',
            'STARTUP_DELAY':'30',
            'DB_HOST': databaseHost,
            'DB_PORT': databasePort,
            'DB_DATABASE': databaseName,
            'DB_USERNAME': databaseUser,
            'DB_PASSWORD': databaseUserPassword
        }
    }
}