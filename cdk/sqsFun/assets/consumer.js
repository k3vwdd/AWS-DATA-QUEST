import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const sqsClient = new SQSClient({});
const dynamodbClient = new DynamoDBClient({});

export async function handler(event, context) {
    try {
        console.log("Received SQS event:", JSON.stringify(event, null, 2));
        console.log("body", JSON.stringify(event.Records[0]?.body, null, 2));
        console.log("Region", JSON.stringify(event.Records[0]?.awsRegion, null, 2));

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: event.Records[0]?.body || "No message body found",
                event: event,
            }),
        };
    } catch (err) {
        console.error("Error occurred:", err);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                error: "An error occurred while processing the event",
                details: err.message,
            }),
        };
    }
}
