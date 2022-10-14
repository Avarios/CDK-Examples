import { Stack, StackProps, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class PiwigoInfraStack extends Stack {

  public SshKeyName: string;
  public CertificateArn: string;

  constructor(construct: Construct, id: string, props?: StackProps) {
    super(construct, id, props);

    this.SshKeyName = new CfnParameter(this, 'keyname', {
      type: "String",
      description: "Keyname for accesing trough the instance trough SSH"
    }).valueAsString;

    this.CertificateArn = new CfnParameter(this, 'certificateArn', {
      type: "String",
      description: "Insert the ARN for the SSL Certificate Load Balancer"
    }).valueAsString;

  }
}