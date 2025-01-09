import {
    Context,
    // Common AWS Lambda Event Types
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    DynamoDBStreamEvent,
    S3Event,
    SNSEvent,
    SQSEvent,
    CloudWatchLogsEvent,
    CloudFormationCustomResourceEvent,
    CodePipelineEvent,
    CognitoUserPoolEvent,
    FirehoseTransformationEvent,
    KinesisStreamEvent,
    LexEvent,
    ALBEvent,
    AppSyncResolverEvent
} from "aws-lambda";

export async function handler(event: DynamoDBStreamEvent, context: Context) {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));

        for (let i = 0; i < event.Records.length; i++) {
            const parsedBody = JSON.stringify(event.Records[i], null, 2);
            console.log(parsedBody);
            console.log(context.logStreamName);
        }

        return `Successfully processed ${event.Records.length} records.`;
    } catch (error) {
        console.error('Error processing records:', error);
        throw error;
    }
}
