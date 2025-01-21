import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayEvent } from "aws-lambda";

const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = process.env.TABLE_NAME;

async function listDbItems() {
    const input = {
        TableName: tableName,
    };
    const command = new ScanCommand(input);
    try {
        const response = await docClient.send(command);
        const items = response.Items?.map(item => unmarshall(item)) || [];
        return {
            statusCode: 200,
            body: JSON.stringify(items),
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
