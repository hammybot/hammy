import { Client } from 'discord.js';
import { EventEmitter } from 'events';

import { MessageReceiver } from '../models/message_receiver';

export class Dispatcher extends EventEmitter {
	private _discordApiToken = process.env.DISCORD_BOT_TOKEN;
	private _messageReceivers: Array<MessageReceiver>;

	public DiscordClient: Client;
	public BotId = '';

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
		this.BotId = this.DiscordClient.user.id;

		this.DiscordClient.on('message', message => {
			if (message.author.id === this.BotId) {
				return;
			}

			console.log(`Recieved message: ${message}`);

			this._messageReceivers.forEach(receiver => {
				if (message.content.match(receiver.regex)) {
					receiver.callback(message);
				}
			});
		});
	}

	register(receiver: MessageReceiver) {
		this._messageReceivers.push(receiver);
	}
}
