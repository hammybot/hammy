import "reflect-metadata";
import { config } from "dotenv";
config();

import { Intents, Interaction, Message } from "discord.js";
import { Client } from "discordx";
import { importx } from "@discordx/importer";

const isDev = () => {
	if (process.env.NODE_ENV === "development") {
		return true;
	}
	return false;
}

const client = new Client({
	botId: isDev() ? "test-bot" : "hammy",
	botGuilds: isDev() ? ["768357607931904022"] : undefined,
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES
	],
	silent: false
});

client.once("ready", async () => {
	await client.initApplicationCommands({
		guild: { log: true },
		global: { log: true }
	});
	await client.initApplicationPermissions(true);
});

client.on("interactionCreate", (interaction: Interaction) => {
	client.executeInteraction(interaction);
});

client.on("messageCreate", (message: Message) => {
	client.executeCommand(message);
});

async function start() {
	await importx(__dirname + "/commands/**/*.{ts,js}");
	await client.login(process.env.DISCORD_BOT_TOKEN ?? "")
}

start();
