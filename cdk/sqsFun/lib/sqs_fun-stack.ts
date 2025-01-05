import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class SqsFunStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const dbTable = new dynamodb.TableV2(this, "ProcessedQueueDB", {
            partitionKey: {
                name: "coderId",
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
            tableName: "checkinData",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const dlq = new sqs.Queue(this, "deadLetterQueue", {
            queueName: "dlq",
        });

        const queue1 = new sqs.Queue(this, "eventSequenceQueue", {
            queueName: "MyMessageQueue",
            visibilityTimeout: cdk.Duration.seconds(60),
            deadLetterQueue: {
                maxReceiveCount: 10,
                queue: dlq,
            },
        });

        const lambdaSqsProducer = new lambda.Function(this, "producer", {
            functionName: "producer",
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "producer.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../assets")),
            environment: {
                QUEUE_URL: queue1.queueUrl,
            },
        });

        queue1.grantSendMessages(lambdaSqsProducer);

        const lambdaSqsConsumer = new lambda.Function(this, "consumer", {
            functionName: "consumer",
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "consumer.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../assets")),
            environment: {
                DLQ_URL: dlq.queueUrl,
            },
        });

        queue1.grantConsumeMessages(lambdaSqsProducer);
        dlq.grantSendMessages(lambdaSqsProducer);

        lambdaSqsProducer.addEventSource(
            new SqsEventSource(queue1, {
                batchSize: 10,
            }),
        );

        new cdk.CfnOutput(this, "QueueUrl", {
            value: queue1.queueUrl,
            description: "URL of the main queue",
        });

        new cdk.CfnOutput(this, "DLQUrl", {
            value: dlq.queueUrl,
            description: "URL of the dead letter queue",
        });

        new cdk.CfnOutput(this, "TableName", {
            value: dbTable.tableName,
            description: "Name of the DynamoDB table",
        });
    }
}
