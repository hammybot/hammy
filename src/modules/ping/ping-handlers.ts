import { Message } from 'discord.js';
import { Stopwatch } from 'ts-stopwatch';

import { BOT_MESSAGES } from '../../utils/constants';

export const SendPing = async (msg: Message) => {
	const timer = new Stopwatch();

	timer.start();
	const pongMsg = await msg.channel.send(BOT_MESSAGES.PONG) as Message;
	timer.stop();

	pongMsg.edit(`${pongMsg.content} ${'`'}${timer.getTime()}ms${'`'}`);
};
