import { SNSEvent, SNSEventRecord } from "aws-lambda";

export async function handler(event: SNSEvent): Promise<void> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));
    for (let i = 0; i < event.Records.length; i++) {
        await processSnsMessage(event.Records[i]);
    }
    console.log("Handler: Done");
}

async function processSnsMessage(record: SNSEventRecord) {
    try {
        const message: string = JSON.stringify(record.Sns.Message);
        console.log(`[Service] Coupon service recieved message: ${JSON.parse(message)}`);
    } catch (error) {
        console.error("Error processing records:", error);
        throw error;
    }
}

