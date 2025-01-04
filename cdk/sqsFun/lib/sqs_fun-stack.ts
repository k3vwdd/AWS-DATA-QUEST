import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";


export class SqsFunStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const queue1 = new sqs.Queue(this, "Queue1", {
            queueName: "MyMessageQueue",
            visibilityTimeout: cdk.Duration.seconds(60),
        });

        const lambdaSqsProducer = new lambda.Function(this, "producer", {
            functionName: "producer",
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "index.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../assets")),
        });
    }
}
