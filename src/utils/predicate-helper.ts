import { injectable } from 'inversify';

import { MessageHandlerPredicate } from '../models/message-handler';

import { DiscordMessage } from './discord-message';

@injectable()
export class PredicateHelper {
	createContainsPredicate(str: string, caseSensitive: boolean): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const cleanContent = msg.getCleanContent();

			const messageContent = caseSensitive ? cleanContent : cleanContent.toLowerCase();
			const matchString = caseSensitive ? str : str.toLowerCase();
			return messageContent.includes(matchString);
		};
	}

	createRegexPredicate(testRegex: RegExp): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const cleanContent = msg.getCleanContent();
			return testRegex.test(cleanContent);
		};
	}

	createChannelTypePredicate(type: 'dm' | 'group' | 'text' | 'voice' | 'category' | 'news' | 'store'): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const channel = msg.getChannel();
			return channel.type === type;
		};
	}

	createUniqueMentionsPredicate(
		numOfUniqueMentions: number, excludeBotMention?: boolean, excludeSelf?: boolean
	): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const mentionedUsers = msg.getMentionedUsers();
			const author = msg.getAuthorUser();
			const bot = msg.getBotUser();

			const uniqueMentionsSet = new Set(mentionedUsers.values());
			uniqueMentionsSet.forEach((userMention) => {
				if ((excludeSelf && userMention.id === author.id) || (excludeBotMention && userMention.id === bot.id)) {
					uniqueMentionsSet.delete(userMention);
				}
			});

			return uniqueMentionsSet.size === numOfUniqueMentions;
		};
	}

	createUserInVoiceChannelPredicate(): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const member = msg.getAuthorMember();
			return member && member.voiceChannel ? true : false;
		};
	}

	createBotPlayingMediaPredicate(): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			const dispatcher = msg.getDispatcher();
			return dispatcher !== null;
		};
	}

	createBotNotPlayingMediaPredicate(): MessageHandlerPredicate {
		return (msg: DiscordMessage) => {
			return !this.createBotPlayingMediaPredicate()(msg);
		};
	}
}









