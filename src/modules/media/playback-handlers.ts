import { Message } from 'discord.js';

import { BOT_MESSAGES } from '../../utils/constants';

const _isValidVoiceConnection = (msg: Message) => {
	const voiceChannel = msg.member.voiceChannel;

	if (!voiceChannel) {
		msg.reply(BOT_MESSAGES.NO_VOICE_CHANNEL);
		return false;
	}

	if (!voiceChannel.connection || !voiceChannel.connection.dispatcher) {
		msg.reply(BOT_MESSAGES.NO_VOICE_CONNECTION);
		return false;
	}

	return true;
};

export const MediaPause = async (msg: Message) => {
	if (_isValidVoiceConnection(msg)) {
		msg.member.voiceChannel.connection.dispatcher.pause();
	}
};

export const MediaResume = async (msg: Message) => {
	if (_isValidVoiceConnection(msg)) {
		msg.member.voiceChannel.connection.dispatcher.resume();
	}
};

export const MediaStop = async (msg: Message) => {
	if (_isValidVoiceConnection(msg)) {
		msg.member.voiceChannel.connection.dispatcher.end();
	}
};
