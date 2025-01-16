import {
    DetectModerationLabelsCommand,
    RekognitionClient,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({});

export interface S3Info {
    bucket: string;
    key: string;
}

export interface Process_S3_event {
    s3_info: S3Info;
}
export async function handler(event: Process_S3_event) {
    console.log("Event recieved from rek:", event);
    const image = {
        S3Object: {
            Bucket: event.s3_info.bucket,
            Name: event.s3_info.key,
        },
    };
    const response = await client.send(
        new DetectModerationLabelsCommand({
            Image: image,
        }),
    );
    console.log(response);
    const moderationLabels = response.ModerationLabels ?? [];
    if (moderationLabels.length === 0) {
        return {
            safe_content: true,
        };
    } else {
        return {
            safe_content: false,
        };
    }
}
