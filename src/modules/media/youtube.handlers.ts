import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS, YtdlCreator } from '../../types';
import {
	combinePredicates,
	createBotNotPlayingMediaPredicate,
	createChannelTypePredicate,
	createRegexPredicate,
	createUserInVoiceChannelPredicate
} from '../../utils';
import { REGEX } from '../../utils/constants';

import { VoiceChannelService } from './voice-channel.service';

@injectable()
export class PlayYoutubeUrlMessageHandler implements MessageHandler {

	constructor(
		@inject(SYMBOLS.YtdlCreator) private _ytdlCreator: YtdlCreator,
		@inject(SYMBOLS.VoiceChannelService) private _voiceChannelService: VoiceChannelService
	) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createRegexPredicate(REGEX.COMMAND_PLAY_YOUTUBE),
			createUserInVoiceChannelPredicate(),
			createBotNotPlayingMediaPredicate()
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const stream = this._ytdlCreator(message.cleanContent, { filter: 'audioonly' });

		this._voiceChannelService.streamToVoiceChannel(message.member.voiceChannel, stream);
	}
}
