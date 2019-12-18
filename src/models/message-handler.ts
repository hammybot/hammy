import { DiscordMessage } from '../utils';

export type MessageHandlerPredicate = (msg: DiscordMessage) => boolean;

export interface MessageHandler {
	createHandlerPredicate: () => MessageHandlerPredicate;
	handleMessage: (msg: DiscordMessage) => Promise<void>;
}
