#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IntegrationStack } from '../lib/integration/infrastructure';
//import { APIStack } from '../lib/api/infrastructure';
//import { ReokognitionStack } from '../lib/recognition/infrastructure';

const CDK_DEFAULT_REGION = 'use-east-1';
const app = new cdk.App();

const apiStack = new APIStack(app, 'APIStack', {
   env: { region: CDK_DEFAULT_REGION },
}

const integrationStack = new IntegrationStack(app, 'IntegrationStack', {
   env: { region: CDK_DEFAULT_REGION },
});



