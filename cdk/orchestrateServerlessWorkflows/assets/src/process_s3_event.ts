import { S3Event, S3EventRecord } from "aws-lambda";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

interface StepFunctionInput {
    s3_info: {
        bucket: string;
        key: string;
    };
    message: {
        content: string;
    }
}

export async function handler(event: S3Event | StepFunctionInput): Promise<void | StepFunctionInput> {
    console.log("Event received:", event);
    if ("Records" in event) {
        for (const record of event.Records) {
            await processS3Event(record);
        }
    } else {
        return event;
    }
}

async function processS3Event(record: S3EventRecord) {
    const s3Client = new S3Client({});
    const sfnClient = new SFNClient({});

    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    try {
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const obj = await s3Client.send(getObjectCommand);

        const headObjectCommand = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const responseMetadata = await s3Client.send(headObjectCommand);

        console.log('---- Metadata from S3 ----');
        console.log(responseMetadata);

        if (responseMetadata.Metadata?.message) {
            const inputStep = {
                s3_info: {
                    bucket: bucket,
                    key: key
                },
                message: {
                    content: responseMetadata.Metadata.message
                }
            };

            console.log('Will start Step function with Input:', JSON.stringify(inputStep));

            const stateMachineCommand = new StartExecutionCommand({
                stateMachineArn: 'arn:aws:states:us-east-1:950033952142:stateMachine:MyStateMachine-x3r3n7izj',
                input: JSON.stringify(inputStep)
            });

            await sfnClient.send(stateMachineCommand);
        } else {
            console.log("No metadata found in S3 image");
        }
    } catch (error) {
        console.error("Error processing S3 Records:", error);
        throw error;
    }
}
