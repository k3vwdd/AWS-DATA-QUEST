import {
    GetItemCommand,
    DynamoDBClient,
    ListTablesCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

async function getAppTableName() {
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    if (response.TableNames && response.TableNames.length > 0) {
        return response.TableNames[0];
    } else {
        throw new Error("No tables found");
    }
}

async function getItem(id) {
    try {
        const input = {
            TableName: "app_table",
            Key: {
                id: {
                    S: id,
                },
            },
            ConsistentRead: true,
        };

        const command = new GetItemCommand(input);
        const response = await client.send(command);

        if (!response.Item) {
            return {
                found: false,
                message:
                    "I found the table but there is no item in it with this id, you can create an item in DynamoDB using the console.",
                data: null,
            };
        }

        return {
            found: true,
            message: "Item found",
            data: response.Item,
        };
    } catch (error) {
        console.error("DynamoDB Error:", error);
        return {
            found: false,
            message: "Error querying DynamoDB",
            error: error.message,
        };
    }
}

export async function handler(event, context) {
    try {
        const queryParameters = event.queryStringParameters;

        if (!queryParameters) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: "No query parameters provided",
                    event: event,
                }),
            };
        }

        // Get ID from query parameters
        const str_id = queryParameters.id;
        const result = await getItem(str_id);

        return {
            statusCode: result.found ? 200 : 404,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: result.message,
                id: str_id,
                item: result.data,
                success: result.found,
            }),
        };
    } catch (err) {
        console.error("Error occurred:", err);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "An error occurred",
                error: err.message,
            }),
        };
    }
}
