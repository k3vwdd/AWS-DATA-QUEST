import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent } from "aws-lambda";

const dbClient = new DynamoDBClient();
const tableName = process.env.TABLE_NAME;

async function listDbItems() {
    const input = {
        TableName: tableName,
    };
    const command = new ScanCommand(input);
    try {
        const response = await dbClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify(response.Items),
        };
    } catch (error) {
        console.error("Couldn't connect to db", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

export async function handler(event: APIGatewayEvent) {
    console.log(`Event Recieved: ${JSON.stringify(event, null, 2)}`);
    try {
        return await listDbItems();
    } catch (error) {
        console.error("Unable to list db items", error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}
