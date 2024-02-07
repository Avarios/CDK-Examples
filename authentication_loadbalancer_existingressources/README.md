# Summary

This CDK Project is written for a specific scenario:

If you have an application running on EC2 with no Authentication and you want to expose this to the Net, you currently don't have that much options.
That's where Amazon Cognito and Amazon Elastic Load Balancing comes to rescue.
With ALB you can use the OIDC and Cognito integration to use Authentication to secure your app.

This CDK spins up a new ALB and Cognito Userpool with a Cognito App Client and connects it with your existing VPC and EC2.

## Configuration.
In the Folder "lib" you habe the "parameters.ts"
Please fill out the fields:

* "vpcid" : The VPC ID where the EC2 is running (usually starts with vpc-)
* "targetInstancePortNumber" : The Port which the applications listen on (HTTP = 80 , HTTPS = 443)
* "targetInstanceId" : The Instance ID where the traffic is routed to after authentication
* "existingSecurityGroupId" : Existing Security Group to add the rule for traffic from ALB to EC2
* "accountNumber" : Account Number where the EC2 is running in
* "region" : Regionw here the infrastructure is running in
* "certificateArn" : The Certificate for the HTTPS Listener for the ALB
* "cognitoDomanPrefix" : in this Example we are using the CognitoDomain Feature to Host the UI for Login. Therefore you have to add a unique name for the domain.
If you get an error it can be the domain name is already taken. Please choose another one.

If you have added all of the values just run `cdk deploy` and see the magic happens.
After everything was deployed, login to your account and do following steps:

1. Open Cognito
2. Open your User Pool
3. Go to the Integration tab
4. Open the App Client 
5. Click the Edit Button on the HostedUI
6. change every callback url so they are all lower case (Yes this is a bug in CDK or Cognito)

After everything is done, you can create users or mark them as verified
Here is a (https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users.html)[Howto] for managing Users in Cognito.
You can disable user self signup service by setting `selfSignUpEnabled:false` in `authenticationLoadBalancer.ts` file in line 57 

WARNING: This CDK Manipulates existing ressources, no warranty taken by me , use at your own risk.
This CDK is constantly evolving. If you see errors or improvements, open an issue :) 

## AWS CLI and CDK
Never worked with AWS CLI and CDK ?

here are some manuals to setup those to make this project work:

https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install

https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html