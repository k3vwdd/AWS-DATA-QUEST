import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBDocumentClient, PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { SQSEvent } from "aws-lambda";
import { Rekognition } from "aws-sdk";

const topicArn = process.env.TOPIC_ARN;
const tableName = process.env.TABLE_NAME;
// const queueUrl

const rekClient = new RekognitionClient({});
const dbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);
const snsClient = new SNSClient();


async function detectLabels(bucket: string, key: string): Promise<Rekognition.Label[]> {
    try {
        const input = {
            Image: {
                S3Object:  {
                    Bucket: bucket,
                    Name: key,
                },
            },
             MinConfidence: Number("70.0"),
             MaxLabels: Number("10"),
        };
        const command = new DetectLabelsCommand(input);
        const response = await rekClient.send(command);
        const labels = response.Labels ?? [];
        if (labels.length === 0) {
            return [];
        } else {
            return labels;
        }
    } catch (error) {
        console.log("Error in detectLabels()", error);
        return [];
    }
};

async function storeDbResult(dbItem: PutCommandInput) {
    try {
        const command = new PutCommand(dbItem);
        const response = await ddbDocClient.send(command);
        if (response.$metadata.httpStatusCode === 400) {
            throw new Error("Something went wrong trying to put a new item in db");
        }
    } catch (error) {
        console.log("Couldn't put that shit in the db");
    }
};

async function triggerSns(message: string) {
    const input = {
        TopicArn: topicArn,
        Message: message,
        Subject: "You the Man Kevin, SUCCESS",
    };

    const command = new PublishCommand(input);
    const response = await snsClient.send(command);
    if (response.$metadata.httpStatusCode === 400) {
        throw new Error("Something went wrong sending sns message");
    };
};

export async function handler(event: SQSEvent) {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    try {
        for (let i = 0; i < event.Records.length; i++) {
            //const receiptHandle = event.Records[i].receiptHandle; // use to delete sqs message
            const parsedBody = JSON.parse(event.Records[i].body);
            //console.log(JSON.stringify(parsedBody));

            for (let r = 0; r < parsedBody.Records.length; r++) {
                const bucketName = parsedBody.Records[r].s3.bucket.name;
                const key = parsedBody.Records[r].s3.object.key;

                const lables = await detectLabels(bucketName, key);
                //console.log(JSON.stringify(lables, null, 2));

                const dbResult = [];
                const dbLabels = lables;
                for (let l = 0; l < dbLabels.length; l++) {
                    //console.log(`HI! ${JSON.stringify(dbLabels[l].Name, null, 2)}`);
                    dbResult.push(dbLabels[l].Name);
                    //console.log(`HI! ${JSON.stringify(dbResult, null, 2)}`);
                };
                const dbItem = {
                    TableName: tableName,
                    Item: {
                        image: key,
                        labels: dbResult,
                    },
                }
                await storeDbResult(dbItem);
                await triggerSns(JSON.stringify(dbResult));
                }
        };

    } catch (error) {
        console.error("Handler Error =>", error);
    }
};
