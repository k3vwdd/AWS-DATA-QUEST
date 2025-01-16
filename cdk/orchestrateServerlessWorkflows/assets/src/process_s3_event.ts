import { S3Client , HeadObjectCommand } from "@aws-sdk/client-s3";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
const s3Client = new S3Client({});
const sfnClient = new SFNClient({});

export async function handler(event: any) {
    console.log("Event received from process_s3_event:", JSON.stringify(event));
        for (const record of event.Records) {
            try {
                const headObjectCommand = new HeadObjectCommand({
                    Bucket: record.s3.bucket.name,
                    Key: record.s3.object.key,
                });
                const response = await s3Client.send(headObjectCommand);
                console.log("head ObjectCommand response:", JSON.stringify(response));

                const stateInput = {
                    s3_info: {
                        bucket: record.s3.bucket.name,
                        key: record.s3.object.key,
                    },
                    message: {
                        content: response.Metadata?.message,
                    }
                };

                const stateMachineCommand = new StartExecutionCommand({
                    stateMachineArn: "arn:aws:states:us-east-1:950033952142:stateMachine:MyStateMachine-w7861hwfg",
                    input: JSON.stringify(stateInput)
                });
                console.log("Will start step functions with Input:", JSON.stringify(stateInput));

                await sfnClient.send(stateMachineCommand);
            } catch (error) {
                console.error("Error processing S3 Records:", error);
                throw error;
            }
        }
}
