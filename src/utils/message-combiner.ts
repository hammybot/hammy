import { MessageHandlerPredicate } from '../models/message-handler';

import { DiscordMessage } from './discord-message';

export const combinePredicates = (...matchers: MessageHandlerPredicate[]): MessageHandlerPredicate => {
	return (msg: DiscordMessage) => {
		return matchers.every((matcher) => matcher(msg));
	};
};
