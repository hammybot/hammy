import { Message } from 'discord.js';
import * as ytdl from 'ytdl-core';

import { BOT_MESSAGES, COMMANDS } from '../../utils/constants';

export const PlayYoutube = async (msg: Message) => {
	const ytUrl = msg.content.match(COMMANDS.PLAY_YOUTUBE);
	if (!ytUrl || !ytUrl[0] || !msg.guild) {
		return;
	}

	const voiceChannel = msg.member.voiceChannel;

	if (!voiceChannel) {
		msg.reply(BOT_MESSAGES.NO_VOICE_CHANNEL);
		return;
	}

	if (voiceChannel.connection) {
		msg.reply(BOT_MESSAGES.ALREADY_PLAYING);
		return;
	}

	voiceChannel.join().then((connection: any) => {
		const stream = ytdl(ytUrl[0], { filter: 'audioonly' });
		const dispatcher = connection.playStream(stream);

		dispatcher.on('end', () => {
			dispatcher.end();

			voiceChannel.leave();
		});
	}).catch(console.log);
};
