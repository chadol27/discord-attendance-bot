import { Client, Events, GatewayIntentBits } from "discord.js";

import { registerAttendanceEvents } from "./attendance.js";
import { commands } from "./commands.js";
import { loadConfig } from "./config.js";

const token = process.env.DISCORD_TOKEN;
const databasePath = process.env.DB_PATH;

if (!token) {
  throw new Error("DISCORD_TOKEN is required.");
}

if (!databasePath) {
  throw new Error("DB_PATH is required.");
}

const config = await loadConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  await readyClient.application.commands.set(commands);

  console.log(`Logged in as ${readyClient.user.tag}, ${new Date().toLocaleString()}`);
});

registerAttendanceEvents(client, config);

await client.login(token);
