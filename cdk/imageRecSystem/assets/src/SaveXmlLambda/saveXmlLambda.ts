import { S3Client , PutObjectCommand} from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent } from "aws-lambda";

const bucket = process.env.BUCKET_NAME ?? "";
const key = "integration.xml";
const s3Client = new S3Client();

async function saveFileToS3(bucket: string, key: string, body: any) {
    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        });
        const response = await s3Client.send(command);
        if (!response) {
            throw new Error("Upload command failed");
        }
    } catch (error) {
        console.error("error out here you heard");
        throw new Error("Upload Failed");
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

