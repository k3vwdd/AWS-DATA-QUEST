#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { IntegrationStack } from '../lib/integration/infrastructure';
import { APIStack } from "../lib/api/infrastructure";
import { RekognitionStack } from "../lib/recognition/infrastructure";

const CDK_DEFAULT_REGION = "us-east-1";
const app = new cdk.App();

const apiStack = new APIStack(app, "APIStack", {
    env: { region: CDK_DEFAULT_REGION },
});

const integrationStack = new IntegrationStack(app, 'IntegrationStack', {
   env: { region: CDK_DEFAULT_REGION },
});

const rekognitionStack = new RekognitionStack(app, "RekognitionStack", {
    env: { region: CDK_DEFAULT_REGION },
});

rekognitionStack.addDependency(integrationStack);
rekognitionStack.addDependency(apiStack);
