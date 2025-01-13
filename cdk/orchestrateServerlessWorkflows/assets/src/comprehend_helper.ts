import {
    ComprehendClient,
    DetectSentimentCommand,
} from "@aws-sdk/client-comprehend";

type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

interface stepFunctionEvent {
    s3_info: {
        bucket: string;
        kety: string;
    };
    message: {
        content: string;
    };
}

enum ComprehendLanguageCode {
    English = "en",
}

export async function handler(
    event: stepFunctionEvent,
): Promise<{ sentiment: Sentiment }> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));

    const client = new ComprehendClient({});
    try {
        const input = {
            Text: event.message.content,
            LanguageCode: ComprehendLanguageCode.English,
        };
        const command = new DetectSentimentCommand(input);
        const response = await client.send(command);

        if (!response.Sentiment) {
            throw new Error("no sentiment detected");
        }

        return {
            sentiment: response.Sentiment as Sentiment,
        };
    } catch (error) {
        console.error("Error processing:", error);
        return { sentiment: "NEUTRAL" };
    }
}
