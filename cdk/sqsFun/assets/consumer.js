import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";

const sqsClient = new SQSClient({});
const dynamodbClient = new DynamoDBClient({});

export async function handler(event, context) {
    try {
        //console.log("Received SQS event:", JSON.stringify(event, null, 2));
        //console.log("body", JSON.stringify(event.Records[0]?.body, null, 2));
        //console.log("body", JSON.stringify(event.Records, null, 2));

        if (event.Records && event.Records.length > 0) {
            for (let i = 0; i < event.Records.length; i++) {
                try {
                    const parsedBody = JSON.parse(event.Records[i].body);
                    console.log("ParsedBody:", parsedBody);
                    console.log(`Coder ID:`, parsedBody.coder_id);
                    console.log(`Spot ID:`, parsedBody.spot_id);
                    console.log(`Timestamp:`, parsedBody.timestamp);
                    console.log(`Coder ID (${typeof parsedBody.coder_id}):`, parsedBody.coder_id);
                    console.log(`Spot ID (${typeof parsedBody.spot_id}):`, parsedBody.spot_id);
                    console.log(`Timestamp (${typeof parsedBody.timestamp}):`, parsedBody.timestamp);
                    if (!parsedBody.coder_id) {
                        console.log("Coder_id wasn't in the parsedBody");
                        //throw new Error("error in recieved format");
                        return false;
                    }
                    const command = new PutItemCommand({
                        TableName: "checkinData",
                        Item: {
                            coderId: { S: parsedBody.coder_id },
                            timestamp: { N: parsedBody.timestamp.toString() },
                            spotId: { S: parsedBody.spot_id },
                        },
                    });

                    const response = await dynamodbClient.send(command);
                    console.log(response);
                } catch (Error) {
                    console.error(`SOMETHING WENT WRONG ERROR: => `, Error);
                    //throw Error
                    return false;
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Records processed successfully",
                recordCount: event.Records?.length || 0,
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
