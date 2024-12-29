const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = 25900274; // Your API ID
const apiHash = "0aa8d2ef404590b2b2cdd434f50d689d"; // Your API Hash
const stringSession = new StringSession("1BQANOTEuMTA4LjU2LjE3NAG7tQoElNJFqINOMRQOcOblnIqEGFPcfA4erBhIp5R2P/1Mv7YuS+SPFZXS6cey4Tp3kg5kSamYY9yK4ZZMJBUkxaKgQeCPWntquhIm5fZpsvTEvCgJwXOR4O9c3vuoVIFuZ/YVujTQnxgB1/6I6uORXY5Uy8o/XsL4v8k9Yoj+2sade/cxk2jpucJ9B+OaMcJKGtsVc3xv0rOdPjO56BRyYxhdrJL/wJWvH9Dcd+n84lDFRWOsYzbtpb4+qeuYksZbAIWrI+Rli2UtKKhptxjhPYoB2GPanb5zUeJU2l/E8cn46lq95tmyF+aYfksm4XQ8Dbzvb5/4BBPVE0TwZyXzxg==");

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// Helper function to introduce a delay
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    // Start the client
    await client.start({
        phoneNumber: async () => new Promise((resolve) => resolve()),
        password: async () => new Promise((resolve) => resolve()),
        phoneCode: async () => new Promise((resolve) => resolve()),
        onError: (err) => console.log(err),
    });

    console.log("Client connected.");

    // Get all joined channels
    const dialogs = await client.getDialogs();
    const targetChannel = dialogs.find(
        (dialog) => dialog.entity.title === "Filmpur Premium" && dialog.isChannel
    );

    if (!targetChannel) {
        console.error("Channel 'Filmpur Premium' not found.");
        return;
    }

    let offsetId = 25697; // Start from the specified message ID
    const limit = 100; // Process messages in batches of 100

    while (true) {
        try {
            // Fetch the next 100 messages
            const messages = await client.getMessages(targetChannel.entity, {
                limit,
                offsetId,
                reverse: true, // Fetch messages in reverse order
            });

            if (messages.length === 0) {
                console.log("All videos have been processed.");
                break;
            }

            for (const message of messages.reverse()) {
                if (message.media) {
                    let mediaToSend;

                    // Check if it's a video or document and set accordingly
                    if (message.media.className === "MessageMediaVideo") {
                        mediaToSend = message.media.video;
                    } else if (
                        message.media.className === "MessageMediaDocument" &&
                        message.media.document.mimeType.startsWith("video/")
                    ) {
                        mediaToSend = message.media.document;
                    }

                    if (mediaToSend) {
                        try {
                            await client.sendFile("movie_cast_bot", {
                                file: mediaToSend,
                                caption: message.message || "", // Use original caption or leave empty
                            });
                            console.log(`Video sent: ${message.id}`);
                        } catch (sendError) {
                            console.error(`Failed to send video ${message.id}:`, sendError);
                        }

                        // Delay between sending each file
                        await sleep(2000); // Adjust delay (e.g., 2000ms) based on observed limits
                    }
                }
            }

            // Update offsetId to the ID of the first message in the current batch
            offsetId = messages[0].id - 1;

            // Delay between batches to avoid flood detection
            console.log(`Batch completed. Waiting before fetching the next batch.`);
            await sleep(10000); // Adjust batch delay (e.g., 10000ms) based on API usage
        } catch (error) {
            console.error("Error processing messages:", error);
            break; // Exit the loop if there's an error fetching messages
        }
    }
}

main();
