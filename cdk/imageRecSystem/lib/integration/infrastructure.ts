import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEvents from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";

export class IntegrationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const rekognitionQueue = new sqs.Queue(this, "rekognitionImageQueue", {
            visibilityTimeout: cdk.Duration.seconds(30),
        });

        const sqsSubscription = new snsSubs.SqsSubscription(rekognitionQueue, {
            rawMessageDelivery: true,
        });

        const rekognitionEventTopic = new sns.Topic(
            this,
            "rekognitionImageTopic",
            {},
        );

        rekognitionEventTopic.addSubscription(sqsSubscription);

        // to do
        // send intergration sendEmail.handler
        // policy
        // event source
        // add event source
        // We don't need the SendEmail lambda function just yet we can come back to this after testing the Rek stack first

        new cdk.CfnOutput(this, "snsArn", {
            value: rekognitionEventTopic.topicArn,
            exportName: "snsArn",
        });
    }
}
