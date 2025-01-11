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
        const message = JSON.parse(record.Sns.Message);
        const distance: number = message.distance;
        console.log(`[Service] Promotion service recieved message: ${JSON.stringify(message)}`);
        if (distance < 10) {
            console.log("The distance is less then 10 miles");
        }
        console.log(`${distance}`);
    } catch (error) {
        console.error("Error processing records:", error);
        throw error;
    }
}


