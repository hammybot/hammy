import { Client } from 'discord.js';
import { EventEmitter } from 'events';

import { MessageReceiver } from '../models/message-receiver';

export class Dispatcher extends EventEmitter {
	private _discordApiToken = process.env.DISCORD_BOT_TOKEN;
	private _messageReceivers: Array<MessageReceiver>;

	public DiscordClient: Client;

	constructor() {
		super();
		this._messageReceivers = [];

		if (!this._discordApiToken) {
			throw new Error('Please generate a discord token and store in "DISCORD_BOT_TOKEN" environment file.');
		}

		this.DiscordClient = new Client({
			disabledEvents: ['TYPING_START']
		});

		this.DiscordClient.on('ready', () => console.log('hammy ready!'));

		this.DiscordClient.login(this._discordApiToken).then((str) => {
			this.initialize();
		});
	}

	initialize() {
		this.DiscordClient.on('message', message => {
			// Ignore any messages from myself or other bots
			if (message.author.id === message.client.user.id || message.author.bot) { return; }

			this._messageReceivers.forEach(receiver => {
				if (receiver.matcher(message)) {
					receiver.callback(message).catch(console.error);
				}
			});
		});

		this.DiscordClient.on('error', error => {
			console.log(error.message);
		});
	}

	register(receiver: MessageReceiver) {
		this._messageReceivers.push(receiver);
	}
}
