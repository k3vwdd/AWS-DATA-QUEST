import {
    DetectModerationLabelsCommand,
    RekognitionClient,
} from "@aws-sdk/client-rekognition";

interface S3Input {
    bucket: string;
    key: string;
}

console.log("Initializing RekognitionClient...");
const client = new RekognitionClient({});

export async function handler(event: S3Input): Promise<{safe_content: boolean} > {
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
        const moderationLabels = response?.ModerationLabels ?? null;

        if (!moderationLabels) {
            return {
                safe_content: true
            }
        } else {
            return {
                safe_content: false
            }
        }

    } catch (error) {
        console.error("Error occurred:", error);
        return {
                safe_content: false
            }
        };
}
