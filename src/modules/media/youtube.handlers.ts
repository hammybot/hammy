import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS, YtdlCreator } from '../../types';
import { combinePredicates, DiscordMessage, PredicateHelper } from '../../utils';
import { REGEX } from '../../utils/constants';

@injectable()
export class PlayYoutubeUrlMessageHandler implements MessageHandler {

	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.YtdlCreator) private _ytdlCreator: YtdlCreator
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createRegexPredicate(REGEX.COMMAND_PLAY_YOUTUBE),
			this._predicateHelper.createUserInVoiceChannelPredicate(),
			this._predicateHelper.createBotNotPlayingMediaPredicate()
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const messageContent = msg.getCleanContent();
		const stream = this._ytdlCreator(messageContent, { filter: 'audioonly' });

		msg.streamToVoiceChannel(stream);
	}
}
