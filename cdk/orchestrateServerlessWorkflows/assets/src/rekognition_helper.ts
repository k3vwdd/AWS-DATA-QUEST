import { S3Event, S3EventRecord } from "aws-lambda";
import {
    DetectModerationLabelsCommand,
    RekognitionClient,
} from "@aws-sdk/client-rekognition";

export async function handler(event: S3Event): Promise<void> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    for (let i = 0; event.Records.length; i++) {
        await processS3Event(event.Records[i]);
    }
    console.log("Records processed");
}

async function processS3Event(event: S3EventRecord): Promise<{ safe_content: boolean }> {
    const client = new RekognitionClient({});
    const bucket = event.s3.bucket.name;
    const key = event.s3.object.key;
    try {
        const input = {
            Image: {
                S3Object: {
                    Bucket: bucket,
                    Name: key,
                },
            },
        };
        const command = new DetectModerationLabelsCommand(input);
        const response = await client.send(command);
        console.log(`resonse: ${JSON.stringify(response)}`);
        const moderationLables = response.ModerationLabels ?? null;
        if (!moderationLables) {
            return { safe_content: true };
        } else {
            return { safe_content: false };
        }
    } catch (error) {
        console.error("Error processing s3Records:", error);
        return { safe_content: false };
    }
}
