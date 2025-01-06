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
        console.log('Lambda Start - Context:', JSON.stringify({
            functionName: context.functionName,
            awsRequestId: context.awsRequestId,
            remainingTime: context.getRemainingTimeInMillis()
        }));

        const message = {
            coder_id: getRandomnNumberString(3),
            spot_id: getRandomnNumberString(3),
            timestamp: Math.round(+new Date() / 1000),
        };

        console.log('Message to be sent:', JSON.stringify(message, null, 2));
        console.log('Queue URL:', SQS_QUEUE_URL);

        const command = new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            DelaySeconds: 10,
            MessageBody: JSON.stringify(message, null, 2),
        });

        console.log('Sending message to SQS...');
        const response = await client.send(command);
        console.log('SQS Response:', JSON.stringify(response, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                messageId: response.MessageId,
                timestamp: new Date().toISOString(),
                message: 'Message sent successfully'
            })
        };

    } catch (err) {
        console.error('Error details:', {
            errorName: err.name,
            errorMessage: err.message,
            stackTrace: err.stack
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message,
                timestamp: new Date().toISOString(),
                requestId: context.awsRequestId
            })
        };
    }
}
