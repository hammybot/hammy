import { Message } from 'discord.js';

export interface MessageReceiver {
	regex: RegExp;
	callback: (msg: Message) => Promise<void>;
}
