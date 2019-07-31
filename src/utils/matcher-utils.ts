import { Message } from 'discord.js';

import { Matcher } from '../models/message-receiver';

export const combineMatchers = (...matchers: Matcher[]): Matcher => {
	return (msg: Message) => {
		return matchers.every((matcher) => matcher(msg));
	};
};

export const createContainsMatcher = (str: string, caseSensitive: boolean): Matcher => {
	return (msg: Message) => {
		const messageContent = caseSensitive ? msg.content : msg.content.toLowerCase();
		const matchString = caseSensitive ? str : str.toLowerCase();
		return messageContent.includes(matchString);
	};
};

export const createRegexMatcher = (testRegex: RegExp): Matcher => {
	return (msg: Message) => {
		return testRegex.test(msg.content);
	};
};

export const createUniqueMentionsMatcher = (numOfUniqueMentions: number, excludeBotMention: boolean): Matcher => {
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
