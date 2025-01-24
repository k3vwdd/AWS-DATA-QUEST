import { S3Client , PutObjectCommand} from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent } from "aws-lambda";

const bucket = "test-integration-bucket-37223829"
//const key = "integration.xml";
const key = "integration2.xml";
const s3Client = new S3Client();

async function saveFileToS3(bucket: string, key: string, body: string) {
    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        });
        const response = await s3Client.send(command);
        if (!response) {
            throw Error;
        }
    } catch (error) {
        console.error("Failed uploading Object into Bucket => ", error);
        throw error;
    }
}

export async function handler(event: APIGatewayProxyEvent) {
    console.log(`Event Recieved: ${JSON.stringify(event, null, 2)}`);
    try {
        const body = event?.body ?? "";
        await saveFileToS3(bucket, key, body);
        return {
            statusCode: 200,
            body: JSON.stringify("Saved"),
        }

    } catch (error) {
        console.error("Unable to upload", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        }
    }
};

