import { S3Event, S3EventRecord } from "aws-lambda";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function handler(event: S3Event): Promise<void> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    for (let i = 0; i < event.Records.length; i++) {
        await processS3Event(event.Records[i]);
    }
    console.log("S3Event Handler: Done");
}

async function processS3Event(record: S3EventRecord) {
    const client = new S3Client({});
    try {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        const object = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const responseMetadata = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        // need metaData logic to pull the message from
        // aws s3 cp guitar.png s3://lab-bucket-de569280 --metadata '{"message":"I hate this song and the band"}'

        const objectResponse =  await client.send(object);
        const objBodyContents = await objectResponse.Body?.transformToString();
        console.log(`Object Response: ${objBodyContents}`)
        console.log(`MetaDAta Object Response: ${JSON.stringify(responseMetadata)}`);
        console.log(`Bucket name: ${bucket} \nKey value: ${key}`);


    } catch (error) {
        console.error("Error processing S3 Records:", error);
        throw error;
    }
}
