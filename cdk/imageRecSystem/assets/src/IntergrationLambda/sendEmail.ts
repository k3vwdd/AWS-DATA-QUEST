import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { APIGatewayEvent, SQSEvent } from "aws-lambda";
import { SessionManagerParameterValue } from "aws-sdk/clients/ssm";

const ssmClient = new SSMClient();

async function getThirdPartyEndpoint(): Promise<SessionManagerParameterValue> {
    try {
        const input = {
            Name: "thirdparty_endpoint",
        };
        const command = new GetParameterCommand(input);
        const response = await ssmClient.send(command);
        return response.Parameter?.Value ?? '';
    } catch (error) {
        console.log("Couldn't grab value from the parameter store", error);
        throw  error;
    }
}

async function jsonToXml(event: SQSEvent): Promise<string> {
    try {
        const record = event.Records[0];

        let xmlString = '<root>';
        for (const [key, value] of Object.entries(record)) {
            xmlString += `<${key}>${value}</${key}>`;
        }
        xmlString += '</root>';

        console.log('Generated XML:', xmlString);
        return xmlString;
    } catch (error) {
        console.error("couldn't process message", error);
        throw error;
    }
}

async function xmlPost(xmlString: string) {
    const thirdPartyUrl = await getThirdPartyEndpoint();
    console.log(thirdPartyUrl);
    try {
        const response = await fetch(thirdPartyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/xml",
            },
            body: xmlString,
        });
        return response;
    } catch (error) {
        console.error("Issue trying to get/post to 3rd party endpoing", error);
        throw error;
    }
}

export async function handler(event: APIGatewayEvent) {
    try {
        console.log(`Event Recieved: ${JSON.stringify(event, null, 2)}`);
        if (!event.body) {
            throw new Error("no body found in request");
        };

        const data = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        const xmlString = await jsonToXml(data);
        console.log("XML to post:", xmlString);
        const response = await xmlPost(xmlString);
        console.log("Post response:", response);

        return {
            statusCode: 200,
            header: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "xml posted",
                status: response.status
            }),
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "error process request",
                status: error instanceof Error ? error.message : "Uknown error"
            }),
        }
    }
}
