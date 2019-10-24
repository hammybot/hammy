import { Message, TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, createChannelTypePredicate, createRegexPredicate, createUniqueMentionsPredicate, REGEX } from '../../utils';

import { WATODatabase } from './db/wato-database';
import { ChallengeStatus } from './models/challenge-status';
import { createWatoStatusEmbed } from './wato-helper';

@injectable()
export class WATOResponseMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createUniqueMentionsPredicate(1, true),
			createRegexPredicate(REGEX.VALID_NUMBER)
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const challengeResponse = message.cleanContent.match(REGEX.VALID_NUMBER);
		if (!challengeResponse || !challengeResponse[0]) { return; }

		const betLimit = Number(challengeResponse[0]);

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(message.author);
		if (!activeChallenge ||
			activeChallenge.Status !== ChallengeStatus.PendingAccept ||
			activeChallenge.ChallengedId !== message.author.id) { return; }

		if (!Number.isSafeInteger(betLimit) || betLimit <= 1 || betLimit > Number.MAX_SAFE_INTEGER) {
			await message.channel.send(`
			<@${message.author.id}> Your bet needs to be between 1 and 9,007,199,254,740,991
		`);
			return;
		}

		await this._watoDatabase.setBetLimit(activeChallenge, betLimit);

		const challenger = message.guild.members.get(activeChallenge.ChallengerId);
		const challenged = message.guild.members.get(activeChallenge.ChallengedId);

		if (!challenger || !challenged) { return; }

		await challenger.send(`Place your bet for your odds challenge with ${challenged.user.username}`);
		await challenged.send(`Place your bet for your odds challenge with ${challenger.user.username}`);

		const originalChannel = message.client.channels.get(activeChallenge.ChannelId) as TextChannel;
		if (!originalChannel) { return; }

		const statusMessage = await originalChannel.fetchMessage(activeChallenge.StatusMessageId as string);

		// workaround for now
		activeChallenge.Status = ChallengeStatus.PendingBets;
		const newStatusEmbed = await createWatoStatusEmbed(activeChallenge, message.client);
		statusMessage.edit(newStatusEmbed);
	}
}
