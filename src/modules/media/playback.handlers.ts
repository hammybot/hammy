import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, DiscordMessage, PredicateHelper } from '../../utils';
import { REGEX } from '../../utils/constants';

@injectable()
export class PauseMediaMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_PAUSE),
			this._predicateHelper.createUserInVoiceChannelPredicate(),
			this._predicateHelper.createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const dispatcher = msg.getDispatcher();
		if (dispatcher === null) { return; }

		dispatcher.pause();
	}
}

@injectable()
export class ResumeMediaMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_RESUME),
			this._predicateHelper.createUserInVoiceChannelPredicate(),
			this._predicateHelper.createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const dispatcher = msg.getDispatcher();
		if (dispatcher === null) { return; }

		dispatcher.resume();
	}
}

@injectable()
export class StopMediaMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_STOP),
			this._predicateHelper.createUserInVoiceChannelPredicate(),
			this._predicateHelper.createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const dispatcher = msg.getDispatcher();
		if (dispatcher === null) { return; }

		dispatcher.end();
	}
}
