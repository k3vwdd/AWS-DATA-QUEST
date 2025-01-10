import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";


export class AggDataStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const votesTable = new dynamodb.TableV2(this, "votesTableConstruct", {
            partitionKey: {
                name: "id",
                type: dynamodb.AttributeType.STRING,
            },
            tableName: "votes",
            dynamoStream: dynamodb.StreamViewType.NEW_IMAGE,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const newVotes = new lambda.Function(this, "newVotesFunction", {
            functionName: "dynamodbstreams-newvotes",
            runtime: lambda.Runtime.NODEJS_22_X,
            timeout: cdk.Duration.seconds(60),
            memorySize: 128,
            handler: "newvotes.handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../assets/dist/"),
            ),
            environment: {
                TABLE_NAME: votesTable.tableName,
            },
        });

        newVotes.addEventSource(new eventsources.DynamoEventSource(votesTable, {
            startingPosition: lambda.StartingPosition.LATEST,
            enabled: true,
            batchSize: 100,
            maxBatchingWindow:  cdk.Duration.seconds(1),
        }))

        const servicePolicy = new iam.Policy(this, "dynamodbstreams-freePolicy", {
            policyName: "dynamodbstreams-free",
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["cloudwatch:*", "dynamodb:*", "logs:*"],
                    resources: ["*"],
                }),
            ],
        });

        newVotes.role?.attachInlinePolicy(servicePolicy);
    }
}
