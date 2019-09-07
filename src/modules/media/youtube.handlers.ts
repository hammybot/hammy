import { Message } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Readable } from 'stream';
import * as ytdl from 'ytdl-core';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import {
	combinePredicates,
	createBotNotPlayingMediaPredicate,
	createChannelTypePredicate,
	createRegexPredicate,
	createUserInVoiceChannelPredicate
} from '../../utils';
import { REGEX } from '../../utils/constants';

@injectable()
export class YoutubeMessageHandler implements MessageHandler {

	constructor(
		@inject(SYMBOLS.YtdlCreator) private _ytdlCreator: (url: string, opts?: ytdl.downloadOptions | undefined) => Readable
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
		const ytUrl = message.content.match(REGEX.COMMAND_PLAY_YOUTUBE);
		if (!ytUrl || !ytUrl[0]) { return; }

		const voiceChannel = message.member.voiceChannel;

		const connection = await voiceChannel.join();
		const stream = this._ytdlCreator(ytUrl[0], { filter: 'audioonly' });

		const dispatcher = connection.playStream(stream);
		dispatcher.on('end', () => {
			dispatcher.end();
			voiceChannel.leave();
		});
	}
}
