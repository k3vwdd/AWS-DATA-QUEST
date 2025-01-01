import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

(async () => {
    try {
        const app_table = await getAppTableName();
        console.log("App Table:", app_table);
    } catch (error) {
        console.error("Error fetching table name:", error);
    }
})();

async function getAppTableName() {
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    if (response.TableNames && response.TableNames.length > 0) {
        return response.TableNames[0]; // Return the first table name
    } else {
        throw new Error("No tables found");
    }
}

export function handler(event, context) {
    console.log(
        "Received Event: (Here is your ENV) \n" +
            JSON.stringify(process.env, null, 2),
    );

    const msg = "Template message created";

    const response = {
        statusCode: 200,
        body: msg,
        headers: {
            "Content-Type": "application/json",
        },
    };

    return response;
}
