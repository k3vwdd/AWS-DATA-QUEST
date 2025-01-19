import { APIGatewayEvent } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

async function downloadFile(url: string): Promise<Buffer> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("error creating file buffer", error);
        throw new Error("Download Failed");
    }
}

async function uploadFileToS3(bucket: string, key: string, body: Buffer) {
    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        });
        const response = await client.send(command);
        if (!response) {
            throw new Error("Upload command failed");
        }
    } catch (error) {
        console.error("error out here you heard");
        throw new Error("Upload Failed");
    }
}

export async function handler(event: APIGatewayEvent) {
    console.log(JSON.stringify(event, null, 2));
    const url = event.queryStringParameters?.url ?? "";
    const fileName = event.queryStringParameters?.name ?? "";

    try {
        if (!bucketName) {
            return {
                statusCode: 400,
                body: JSON.stringify("Bucket name not configured"),
            };
        }
        if (!url) {
            return { statusCode: 400, body: JSON.stringify("URL is required") };
        }
        if (!fileName) {
            return {
                statusCode: 400,
                body: JSON.stringify("File name is required"),
            };
        }
        const bodyBuffer = await downloadFile(url);
        await uploadFileToS3(bucketName, fileName, bodyBuffer);

        return {
            statusCode: 200,
            body: JSON.stringify("Successfully Uploaded Img!"),
        };
    } catch (error) {
        console.error("Something went wrong", error);
        return {
            statusCode: 500,
            body: JSON.stringify("Error!"),
        };
    }
}
