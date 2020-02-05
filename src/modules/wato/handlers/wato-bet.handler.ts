import { TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATOBetMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('dm'),
			this._predicateHelper.createRegexPredicate(REGEX.VALID_NUMBER)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const challengeResponse = msg.getCleanContent().match(REGEX.VALID_NUMBER);
		if (!challengeResponse || !challengeResponse[0]) { return; }

		const bet = Number(challengeResponse[0].replace(/,/g, ''));
		const author = msg.getAuthorUser();
		const currentChannel = msg.getChannel();

		let activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);
		if (!activeChallenge || !activeChallenge.BetLimit || activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		if (!Number.isSafeInteger(bet) || bet < 1 || bet > activeChallenge.BetLimit) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`
			<@${author.id}> Your bet needs to be a whole number from 1 to ${Number(activeChallenge.BetLimit).toLocaleString()}
			`);
			await currentChannel.send(validationEmbed);
			return;
		}

		await this.setBet(activeChallenge, activeChallenge.ChallengerId === author.id, bet);
		await currentChannel.send(`Got it!`);

		activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);

		if (!activeChallenge ||
			!activeChallenge.ChallengerBet ||
			!activeChallenge.ChallengedBet ||
			activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		await this.completeGame(msg, activeChallenge);
	}

	private async setBet(challenge: Challenge, isAuthorChallenger: boolean, bet: number) {
		if (isAuthorChallenger) {
			if (challenge.ChallengerBet) { return; }
			await this._watoDatabase.setChallengerBet(challenge, bet);
		} else {
			if (challenge.ChallengedBet) { return; }
			await this._watoDatabase.setChallengedBet(challenge, bet);
		}
	}

	private async completeGame(msg: DiscordMessage, challenge: Challenge) {
		const winnerId = challenge.ChallengerBet === challenge.ChallengedBet
			? challenge.ChallengerId : challenge.ChallengedId;

		await this._watoDatabase.completeChallenge(challenge, winnerId);

		const originalChannel = msg.getClientChannel(challenge.ChannelId) as TextChannel;
		if (!originalChannel) { return; }

		const resultsEmbed = await this._watoHelper.createWatoResultsEmbed(winnerId, challenge, msg.getClient());
		originalChannel.send(resultsEmbed);
	}
}
