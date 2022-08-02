#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmazonOpensearchCognitoStack } from '../lib/amazon-opensearch-cognito-stack';
import { CognitoConstruct } from '../lib/cognitoConstruct';
import { Roles } from '../lib/roleConstruct';
import { OpenSearchConstruct } from '../lib/openSearchConstruct';
import { CfnOutput } from 'aws-cdk-lib';

const app = new cdk.App();
let parent = new AmazonOpensearchCognitoStack(app, 'AmazonOpensearchCognitoStack');
let cognito = new CognitoConstruct(parent,'cognitoStack',parent.ApplicationPrefix);
let roles = new Roles(parent,cognito.UserPoolId,parent.ApplicationPrefix);
let openSearch = new OpenSearchConstruct(parent,'openSearchConstruct',{
  AdminSearchRole:roles.openSearchAdminRole,
  ApplicationPrefix:parent.ApplicationPrefix,
  IdentityPoolId:cognito.IdentityPoolId,
  LimitedSearchRole:roles.openSearchLimitedRole,
  //OpenSearchLambdaGrant: null,
  OpenSearchRole: roles.openSearchRole,
  UserPoolId: cognito.UserPoolId,
  UserPoolArn:cognito.UserPoolArn
});

new CfnOutput(parent, 'createUserUrl', {
  description: "Create a new user in the user pool here - add it to the es-admins group if fine grained access controls should not apply.",
  value: "https://" + parent.region + ".console.aws.amazon.com/cognito/users?region=" + parent.region + "#/pool/" + cognito.UserPoolId + "/users"
});

new CfnOutput(parent, 'dashboardUrl', {
  description: "Access Dashboard via this URL.",
  value: "https://"+ openSearch.OpenSearchDomainUrl + "/_dashboards"
});