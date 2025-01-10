import { Context, DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";

function check_record_pattern(record: DynamoDBRecord) {
    if (record.dynamodb && record.dynamodb.NewImage) {
        const newImage = record.dynamodb.NewImage;
        const hasRequiredFields = newImage.improvement.S && newImage.region.S;
        return hasRequiredFields;
    }
    return false;
}

export async function handler(event: DynamoDBStreamEvent) {
    try {
        console.log("Event:", JSON.stringify(event, null, 2));
        for (let i = 0; i < event.Records.length; i++) {
            const record = event.Records[i];
            if (check_record_pattern(record)) {
                const improvement = record.dynamodb?.NewImage?.improvement.S;
                const region = record.dynamodb?.NewImage?.region.S;
                console.log(`Vote for ${improvement} from ${region}`);
            }
        }

        return `Successfully processed ${event.Records.length} records.`;
    } catch (error) {
        console.error("Error processing records:", error);
        throw error;
    }
}
