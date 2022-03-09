import { Stack, Construct } from '@aws-cdk/core';
import { Function, Runtime } from '@aws-cdk/aws-lambda';

export class Compute extends Construct {
    constructor(parent: Stack, id: string) {
        super(parent, id);


        const lambdaFunction = new Function(this, 'lambda-function', {
            runtime: Runtime.NODEJS_14_X,
            // 👇 place lambda in the VPC
            vpc,
            // 👇 place lambda in Private Subnets
            vpcSubnets: {
                subnetGroupName: 'a'
            },
            securityGroups: [this.DatabaseSecurityGroup],
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'index.main',
            code: lambda.Code.fromAsset(path.join(__dirname, '/../src/my-lambda')),
        });
    }
}



