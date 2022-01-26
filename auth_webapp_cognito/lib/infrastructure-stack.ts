import * as cdk from '@aws-cdk/core';
import { CfnParameter } from '@aws-cdk/core';

export class InfrastructureStack extends cdk.Stack {

  public SshKeyName:string;
  public ReplyMail:string;
  public CertificateArn:string;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    this.SshKeyName = new CfnParameter(this,'sshKeyName', {
      description:'Add the Keyname you want to use to access the Webserver'
    }).valueAsString;

    this.ReplyMail = new CfnParameter(this,'replyTo', {
      description:'The Reply address for cognito'
    }).valueAsString;

    this.CertificateArn = new CfnParameter(this,'certificateArn', {
      description:'The SSL Certificate for the ALB'
    }).valueAsString;
  }
}
