import { Message } from 'discord.js';
import { injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import {
	combinePredicates,
	createBotPlayingMediaPredicate,
	createChannelTypePredicate,
	createRegexPredicate,
	createUserInVoiceChannelPredicate
} from '../../utils';
import { REGEX } from '../../utils/constants';


@injectable()
export class PauseMediaMessageHandler implements MessageHandler {

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createRegexPredicate(REGEX.COMMAND_PAUSE),
			createUserInVoiceChannelPredicate(),
			createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(message: Message): Promise<void> {
		message.member.voiceChannel.connection.dispatcher.pause();
	}
}

@injectable()
export class ResumeMediaMessageHandler implements MessageHandler {

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createRegexPredicate(REGEX.COMMAND_RESUME),
			createUserInVoiceChannelPredicate(),
			createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(message: Message): Promise<void> {
		message.member.voiceChannel.connection.dispatcher.resume();
	}
}

@injectable()
export class StopMediaMessageHandler implements MessageHandler {

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createRegexPredicate(REGEX.COMMAND_STOP),
			createUserInVoiceChannelPredicate(),
			createBotPlayingMediaPredicate()
		);
	}

	async handleMessage(message: Message): Promise<void> {
		message.member.voiceChannel.connection.dispatcher.end();
	}
}
