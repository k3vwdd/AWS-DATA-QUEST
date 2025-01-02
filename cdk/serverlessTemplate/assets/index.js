import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

async function getAppTableName() {
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    if (response.TableNames && response.TableNames.length > 0) {
        return response.TableNames[0]; // Return the first table name
    } else {
        throw new Error("No tables found");
    }
}

export async function handler(event, context) {
    //console.log(
    //    "Received Event: (Here is your ENV) \n" +
    //        JSON.stringify(process.env, null, 2),
    //);

    //const msg = "Template message created";
    //const queryStringParameters = event.get("queryStringParameters");
    const msg = "Hello World"
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: msg
        })
    };

    //const response = {
    //    statusCode: 200,
    //    body: msg,
    //    headers: {
    //        "Content-Type": "application/json",
    //    },
    //};

}

