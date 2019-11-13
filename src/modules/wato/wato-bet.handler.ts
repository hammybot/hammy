import { Message, TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, createChannelTypePredicate, createRegexPredicate, REGEX } from '../../utils';

import { WATODatabase } from './db/wato-database';
import { ChallengeStatus } from './models/challenge-status';
import { WatoHelperService } from './wato-helper.service';

@injectable()
export class WATOBetMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('dm'),
			createRegexPredicate(REGEX.VALID_NUMBER)
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const challengeResponse = message.cleanContent.match(REGEX.VALID_NUMBER);
		if (!challengeResponse || !challengeResponse[0]) { return; }

		const bet = Number(challengeResponse[0]);

		let activeChallenge = await this._watoDatabase.getUserActiveChallenge(message.author);
		if (!activeChallenge || !activeChallenge.BetLimit || activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		if (!Number.isSafeInteger(bet) || bet <= 1 || bet > activeChallenge.BetLimit) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`
			<@${message.author.id}> Your bet needs to be between 1 and ${activeChallenge.BetLimit}
			`);
			await message.channel.send(validationEmbed);
			return;
		}

		if (activeChallenge.ChallengerId === message.author.id) {
			if (activeChallenge.ChallengerBet) { return; }
			await this._watoDatabase.setChallengerBet(activeChallenge, bet);
		} else {
			if (activeChallenge.ChallengedBet) { return; }
			await this._watoDatabase.setChallengedBet(activeChallenge, bet);
		}

		await message.channel.send(`Got it!`);

		activeChallenge = await this._watoDatabase.getUserActiveChallenge(message.author);

		if (!activeChallenge ||
			!activeChallenge.ChallengerBet ||
			!activeChallenge.ChallengedBet ||
			activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		const winnerId = activeChallenge.ChallengerBet === activeChallenge.ChallengedBet
			? activeChallenge.ChallengerId : activeChallenge.ChallengedId;

		await this._watoDatabase.completeChallenge(activeChallenge, winnerId);

		const originalChannel = message.client.channels.get(activeChallenge.ChannelId) as TextChannel;
		if (!originalChannel) { return; }

		const resultsEmbed = await this._watoHelper.createWatoResultsEmbed(winnerId, activeChallenge, message.client);
		originalChannel.send(resultsEmbed);
	}
}
