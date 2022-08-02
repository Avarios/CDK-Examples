import { CfnParameter, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AmazonOpensearchCognitoStack extends Stack {

  private applicationPrefix:string

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    Tags.of(this).add('stack', this.stackName, {
        applyToLaunchedInstances: true
    })
    
    this.applicationPrefix = new CfnParameter(this, 'applicationPrefix', {
      default: scope.node.tryGetContext('applicationPrefix'),
      description: "Prefix for the Amazon Cognito domain and the Amazon Elasticsearch Service domain",
      type: "String",
      allowedPattern: "^[a-z0-9]*$",
      minLength: 3,
      maxLength: 20
    }).valueAsString;
  }

  get ApplicationPrefix():string {
    return this.applicationPrefix;
  }
}
