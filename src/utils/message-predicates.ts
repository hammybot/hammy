import { Message } from 'discord.js';

import { MessageHandlerPredicate } from '../models/message-handler';

export const combinePredicates = (...matchers: MessageHandlerPredicate[]): MessageHandlerPredicate => {
	return (msg: Message) => {
		return matchers.every((matcher) => matcher(msg));
	};
};

export const createContainsPredicate = (str: string, caseSensitive: boolean): MessageHandlerPredicate => {
	return (msg: Message) => {
		const messageContent = caseSensitive ? msg.cleanContent : msg.cleanContent.toLowerCase();
		const matchString = caseSensitive ? str : str.toLowerCase();
		return messageContent.includes(matchString);
	};
};

export const createRegexPredicate = (testRegex: RegExp): MessageHandlerPredicate => {
	return (msg: Message) => {
		return testRegex.test(msg.cleanContent);
	};
};

export const createChannelTypePredicate = (
	type: 'dm' | 'group' | 'text' | 'voice' | 'category' | 'news' | 'store'
): MessageHandlerPredicate => {
	return (msg: Message) => {
		return msg.channel.type === type;
	};
};

export const createUniqueMentionsPredicate = (numOfUniqueMentions: number, excludeBotMention: boolean): MessageHandlerPredicate => {
	return (msg: Message) => {
		const uniqueMentionsSet = new Set(msg.mentions.users.values());
		uniqueMentionsSet.forEach((userMention) => {
			if (userMention.id === msg.author.id || (excludeBotMention && userMention.id === msg.client.user.id)) {
				uniqueMentionsSet.delete(userMention);
			}
		});

		return uniqueMentionsSet.size === numOfUniqueMentions;
	};
};

export const createUserInVoiceChannelPredicate = (): MessageHandlerPredicate => {
	return (msg: Message) => {
		return msg.member.voiceChannel ? true : false;
	};
};

export const createBotNotPlayingMediaPredicate = (): MessageHandlerPredicate => {
	return (msg: Message) => {
		return !msg.member.voiceChannel.connection || !msg.member.voiceChannel.connection.dispatcher;
	};
};

export const createBotPlayingMediaPredicate = (): MessageHandlerPredicate => {
	return (msg: Message) => {
		return (msg.member.voiceChannel.connection && msg.member.voiceChannel.connection.dispatcher) ? true : false;
	};
};
