import { Message, StreamDispatcher, VoiceChannel } from 'discord.js';
import { Readable } from 'stream';

export class DiscordMessage {
	constructor(private _message: Message) { }

	getAuthorUser() {
		return this._message.author;
	}

	getAuthorMember() {
		return this._message.member;
	}

	getBotUser() {
		return this._message.client.user;
	}

	getContent() {
		return this._message.content;
	}

	getCleanContent() {
		return this._message.cleanContent;
	}

	getChannel() {
		return this._message.channel;
	}

	getMentionedUsers() {
		return this._message.mentions.users;
	}

	getClient() {
		return this._message.client;
	}

	getClientChannel(channelId: string) {
		return this._message.client.channels.get(channelId);
	}

	getGuildMember(id: string) {
		return this._message.guild.members.get(id);
	}

	getDispatcher(): StreamDispatcher | null {
		if (
			!this._message.member
			|| !this._message.member.voiceChannel
			|| !this._message.member.voiceChannel.connection
			|| !this._message.member.voiceChannel.connection.dispatcher
		) { return null; }

		return this._message.member.voiceChannel.connection.dispatcher;
	}


	async streamToVoiceChannel(stream: Readable): Promise<void> {
		if (!this._message.member) {
			throw new Error(`${this._message.author.username} is not a valid member of a guild`);
		}

		const voiceChannel = this._message.member.voiceChannel;
		if (!voiceChannel) {
			throw new Error(`${this._message.author.username} is not in an active voice channel`);
		}

		const connection = await voiceChannel.join();
		const dispatcher = connection.playStream(stream);
		dispatcher.on('end', () => {
			dispatcher.end();
			voiceChannel.leave();
		});
	}
}
