import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler } from '../models/message-handler';
import { SYMBOLS } from '../types';
import { DiscordMessage } from '../utils';
import { ErrorLogger } from '../utils';

@injectable()
export class MessageRunner {
	constructor(
		@inject(SYMBOLS.MessageHandlers) private _messageHandlers: MessageHandler[],
		@inject(SYMBOLS.ErrorLogger) private _errorLogger: ErrorLogger
	) { }

	async run(message: Message) {
		// Ignore any messages from author or other bots
		if (message.author.id === message.client.user.id || message.author.bot) { return; }

		const discordMessage = new DiscordMessage(message);
		const handler = this._messageHandlers.find(mh => {
			const shouldRunHandler = mh.createHandlerPredicate();
			return shouldRunHandler(discordMessage);
		});

		if (!handler) { return; }

		try {
			await handler.handleMessage(discordMessage);
		} catch (error) {
			this._errorLogger.log(`${handler.constructor.name}: ${error}`);
		}
	}
}
