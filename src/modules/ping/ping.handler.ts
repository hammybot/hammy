import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Stopwatch } from 'ts-stopwatch';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { BOT_MESSAGES, combinePredicates, createChannelTypePredicate, createRegexPredicate, REGEX } from '../../utils';

@injectable()
export class PingMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.StopwatchCreator) private _stopwatchCreator: () => Stopwatch) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createRegexPredicate(REGEX.COMMAND_PING)
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const timer = this._stopwatchCreator();

		timer.start();
		const pongMsg = await message.channel.send(BOT_MESSAGES.PONG) as Message;
		timer.stop();

		pongMsg.edit(`${pongMsg.content} ${'`'}${timer.getTime()}ms${'`'}`);
	}
}
