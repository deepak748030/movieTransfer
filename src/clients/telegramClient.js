const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const createClient = (account) => {
    const client = new TelegramClient(
        new StringSession(account.stringSession),
        account.apiId,
        account.apiHash,
        { connectionRetries: 5 }
    );
    console.log('connected')
    client.on("disconnected", () => {
        console.log("Client disconnected. Reconnecting...");
        client.connect();

    });

    return client;
};

module.exports = { createClient };
