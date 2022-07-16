#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LycheeStack } from '../lib/lychee-stack';
import { ContainerStack } from '../lib/container';
import { NetworkStack } from '../lib/networkStack';
import { SecurityGroups } from '../lib/securityGroups';


const app = new App();
let mainStack = new LycheeStack(app, 'lycheeInfraStack');
let networkStack = new NetworkStack(mainStack, 'lychee-network');
let securityGroupStack = new SecurityGroups(mainStack, 'lychee-sg', networkStack.DefaultVpc);
let containerStack = new ContainerStack(mainStack,'lycheeContainer', networkStack.DefaultVpc);

