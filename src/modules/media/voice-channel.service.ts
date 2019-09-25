import { VoiceChannel } from 'discord.js';
import { injectable } from 'inversify';
import { Readable } from 'stream';

@injectable()
export class VoiceChannelService {
	async streamToVoiceChannel(voiceChannel: VoiceChannel, stream: Readable): Promise<void> {
		const connection = await voiceChannel.join();
		const dispatcher = connection.playStream(stream);
		dispatcher.on('end', () => {
			dispatcher.end();
			voiceChannel.leave();
		});
	}
}
