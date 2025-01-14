import {
    ComprehendClient,
    DetectSentimentCommand,
} from "@aws-sdk/client-comprehend";

type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";

interface MessageContent {
    content: string;
}

enum ComprehendLanguageCode {
    English = "en",
}

const client = new ComprehendClient({});

export async function handler(event: MessageContent): Promise<{ sentiment: Sentiment  }> {
    console.log("Event recieved:", JSON.stringify(event, null, 2));

    try {
        const input = {
            Text: event.content,
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
        return {
                sentiment: "NEUTRAL",
        };
    }
}
