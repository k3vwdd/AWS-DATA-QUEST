import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { SQSEvent } from "aws-lambda";
import { Rekognition } from "aws-sdk";

const topicArn = process.env.TOPIC_ARN;
const tableName = process.env.TABLE_NAME;

const rekClient = new RekognitionClient({});

async function detectLabels(bucket: string, key: string): Promise<Rekognition.Label[]> {
    try {
        const input = {
            Image: {
                S3Object:  {
                    Bucket: bucket,
                    Name: key,
                },
            },
             MinConfidence: Number("70.0"),
             MaxLabels: Number("10"),
        };
        const command = new DetectLabelsCommand(input);
        const response = await rekClient.send(command);
        const labels = response.Labels ?? [];
        if (labels.length === 0) {
            return [];
        } else {
            return labels;
        }
    } catch (error) {
        console.log("Error in detectLabels()", error);
        return [];
    }
};



//async function triggerSns(message) {
//
//};


export async function handler(event: SQSEvent) {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    try {
        for (let i = 0; i < event.Records.length; i++) {
            const receiptHandle = event.Records[i].receiptHandle;
            const parsedBody = JSON.parse(event.Records[i].body);
            console.log(JSON.stringify(parsedBody));

            for (let r = 0; r < parsedBody.Records.length; r++) {
                const bucketName = parsedBody.Records[r].s3.bucket.name;
                const key = parsedBody.Records[r].s3.object.key;
                console.log(JSON.stringify(bucketName));

                const lables = await detectLabels(bucketName, key);
                console.log(JSON.stringify(lables));
            }

        };


    } catch (error) {
        console.error("Handler Error =>", error);
    }
};
