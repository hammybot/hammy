import { Message } from 'discord.js';

export type MessageHandlerPredicate = (msg: Message) => boolean;

export interface MessageHandler {
	messageHandlerPredicate: () => MessageHandlerPredicate;
	handleMessage: (message: Message) => Promise<void>;
}
