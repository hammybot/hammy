import { Client, Message } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler } from '../models/message-handler';
import { SYMBOLS } from '../types';

@injectable()
export class Bot {
	constructor(
		@inject(SYMBOLS.Client) private _client: Client,
		@inject(SYMBOLS.Token) private _token: string | undefined,
		@inject(SYMBOLS.MessageHandlers) private _messageHandlers: MessageHandler[]
	) { }

	public async listen(): Promise<void> {
		if (!this._token) {
			throw new Error('Generate a discord token and store in "DISCORD_BOT_TOKEN" environment file.');
		}

		this._client.on('error', (error) => console.log(error.message));
		this._client.on('message', (message: Message) => {
			// Ignore any messages from author or other bots
			if (message.author.id === message.client.user.id || message.author.bot) { return; }
			this.runMessageHandlers(this._messageHandlers, message);
		});
		await this._client.login(this._token);
	}

	private async runMessageHandlers(messageHandlers: MessageHandler[], message: Message) {
		const messageHandlerPromises = messageHandlers.map(async (handler) => {
			const shouldRunHandler = handler.messageHandlerPredicate();
			if (!shouldRunHandler(message)) { return; }
			try {
				await handler.handleMessage(message);
			} catch (error) {
				console.log(`${handler.constructor.name}: ${error}`);
			}
		});
		await Promise.all(messageHandlerPromises);
	}
}
