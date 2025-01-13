import { S3Event, S3EventRecord } from "aws-lambda";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

export async function handler(event: S3Event): Promise<void> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    for (let i = 0; i < event.Records.length; i++) {
        await processS3Event(event.Records[i]);
    }
    console.log("S3Event Handler: Done");
}

async function processS3Event(record: S3EventRecord) {
    const s3Client = new S3Client({});
    const sFNClient = new SFNClient({});
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    try {
        const input = {
             Bucket: bucket,
             Key: key,
        }
        const s3Command = new HeadObjectCommand(input);
        const response = await s3Client.send(s3Command);

        console.log("----- Metadata from S3 ----");
        console.log(`MetaData: ${JSON.stringify(response?.Metadata)}`);

        const responseMetadata = response?.Metadata;
        if (responseMetadata && responseMetadata.message) {
            const inputStep = {
                "s3_info": {
                    "bucket": bucket,
                    "key": key
                },
                "message": {
                    "content": responseMetadata.message
                }
            }
            console.log(`Will start Step function with Input:  ${JSON.stringify(inputStep)}`);
            const stateMachineInput = {
               stateMachineArn: "arn:aws:states:us-east-1:950033952142:stateMachine:MyStateMachine-x3r3n7izj",
               //name: "STRING_VALUE",
               input: JSON.stringify(inputStep),
            };
            const stateMachineCommand = new StartExecutionCommand(stateMachineInput);
            const stateMachineResponse = await sFNClient.send(stateMachineCommand);
        } else {
            console.log("No metadata found in s3 image");
        }
    } catch (error) {
        console.error("Error processing S3 Records:", error);
        throw error;
    }
}
