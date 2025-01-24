import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { SQSEvent } from "aws-lambda";
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
                "Content-Type": "application/json",
            },
            body: xmlString,
        });
        return response;
    } catch (error) {
        console.error("Issue trying to get/post to 3rd party endpoing", error);
        throw error;
    }
}

export async function handler(event: SQSEvent) {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        const xmlString = await jsonToXml(event);
        const response = await xmlPost(xmlString);

        console.log('Post response:', response);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "XML posted successfully",
                status: response.status
            })
        };
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "Error processing request",
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
