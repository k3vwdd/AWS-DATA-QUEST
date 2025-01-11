import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class ParallelDataProcessingStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const rideShareTopic = new sns.Topic(this, "rideShareTopic", {
            topicName: "rideshare_topic",
            displayName: "topic_display_name",
        });

        const accountService = new lambda.Function(this, "accountServiceFunc", {
            functionName: "account_service",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "account_service.handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../assets/dist/"),
            ),
        });

        const couponService = new lambda.Function(this, "couponServiceFunc", {
            functionName: "coupon_service",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "coupon_service.handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../assets/dist/"),
            ),
        });
    }
}
