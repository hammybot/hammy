import { Message } from 'discord.js';

export type Matcher = (msg: Message) => boolean;

export interface MessageReceiver {
	matcher: Matcher;
	callback: (msg: Message) => Promise<void> | void;
}
