import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const client = new SQSClient({});
const SQS_QUEUE_URL =
    "https://sqs.us-east-1.amazonaws.com/950033952142/MyMessageQueue";

function getRandomnNumberString(len) {
    let result = "";
    for (let i = 0; i < len; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
}

export async function handler(event, context) {
    try {
        const message = {
            coder_id: getRandomnNumberString(3),
            spot_id: getRandomnNumberString(3),
            timestamp: Math.round(+new Date() / 1000),
        };

        const command = new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            DelaySeconds: 10,
            MessageBody: JSON.stringify(message, null, 2),
        });

        const response = await client.send(command);
        console.log(response);
        return response;
    } catch (err) {
        console.error("Error occured: ", err);
    }
}
