import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';

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

        const


    }
}
