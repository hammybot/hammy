import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';

import * as packageJson from '../../../package.json';
import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../utils';

@injectable()
export class VersionMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_VERSION)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		await msg.getChannel().send(`**v${packageJson.version}**`) as Message;
	}
}
