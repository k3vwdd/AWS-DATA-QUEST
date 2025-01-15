import { S3Event } from "aws-lambda";
import {
    HeadObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const s3Client = new S3Client({});
const sfnClient = new SFNClient({});

export async function handler(event: S3Event): Promise<void> {
    console.log("Event:", event);

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        try {
            // Get metadata
            const headResponse = await s3Client.send(
                new HeadObjectCommand({
                    Bucket: bucket,
                    Key: key,
                })
            );

            console.log("---- Metadata from S3 ----");
            console.log(headResponse.Metadata);

            if (headResponse.Metadata?.message) {
                const inputStep = {
                    s3_info: {
                        bucket,
                        key,
                    },
                    message: {
                        content: headResponse.Metadata.message,
                    },
                };

                console.log(
                    "Will start Step function with Input:",
                    JSON.stringify(inputStep)
                );

                await sfnClient.send(
                    new StartExecutionCommand({
                        stateMachineArn:
                            "arn:aws:states:us-east-1:950033952142:stateMachine:MyStateMachine-x3r3n7izj",
                        input: JSON.stringify(inputStep),
                    })
                );
            } else {
                console.log("No metadata found in S3 image");
            }
        } catch (error) {
            console.error("Error processing S3 record:", error);
            throw error;
        }
    }
}
