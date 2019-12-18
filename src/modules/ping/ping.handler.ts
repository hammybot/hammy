import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Stopwatch } from 'ts-stopwatch';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { BOT_MESSAGES, combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../utils';

@injectable()
export class PingMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.StopwatchCreator) private _stopwatchCreator: () => Stopwatch
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_PING)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const textChannel = msg.getChannel();
		const timer = this._stopwatchCreator();

		timer.start();
		const pongMsg = await textChannel.send(BOT_MESSAGES.PONG) as Message;
		timer.stop();

		await pongMsg.edit(`${pongMsg.content} ${'`'}${timer.getTime()}ms${'`'}`);
	}
}
