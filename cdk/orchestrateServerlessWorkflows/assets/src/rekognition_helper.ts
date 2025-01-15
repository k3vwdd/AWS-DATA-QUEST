import {
    DetectModerationLabelsCommand,
    RekognitionClient,
} from "@aws-sdk/client-rekognition";

interface S3Input {
    bucket: string;
    key: string;
}

interface Result {
    image_analysis: {
        safe_content: boolean;
    }
}

const client = new RekognitionClient({});

export async function handler(event: S3Input): Promise<Result> {
    try {
        const input = {
            Image: {
                S3Object: {
                    Bucket: event.bucket,
                    Name: event.key,
                },
            },
        };
        const command = new DetectModerationLabelsCommand(input);
        const response = await client.send(command);
        const moderationLabels = response?.ModerationLabels ?? [];
        return {
            image_analysis: {
                safe_content: moderationLabels.length === 0
            }
        };
    } catch (error) {
        console.error("Error occurred:", error);
        return {
            image_analysis: {
                safe_content: false
            }
        };
    }
}
