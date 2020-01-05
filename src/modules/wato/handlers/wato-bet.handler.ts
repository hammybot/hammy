import { TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
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

		const bet = Number(challengeResponse[0]);
		const author = msg.getAuthorUser();
		const currentChannel = msg.getChannel();

		let activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);
		if (!activeChallenge || !activeChallenge.BetLimit || activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		if (!Number.isSafeInteger(bet) || bet <= 1 || bet > activeChallenge.BetLimit) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`
			<@${author.id}> Your bet needs to be between 1 and ${activeChallenge.BetLimit}
			`);
			await currentChannel.send(validationEmbed);
			return;
		}

		if (activeChallenge.ChallengerId === author.id) {
			if (activeChallenge.ChallengerBet) { return; }
			await this._watoDatabase.setChallengerBet(activeChallenge, bet);
		} else {
			if (activeChallenge.ChallengedBet) { return; }
			await this._watoDatabase.setChallengedBet(activeChallenge, bet);
		}

		await currentChannel.send(`Got it!`);

		activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);

		if (!activeChallenge ||
			!activeChallenge.ChallengerBet ||
			!activeChallenge.ChallengedBet ||
			activeChallenge.Status !== ChallengeStatus.PendingBets) {
			return;
		}

		const winnerId = activeChallenge.ChallengerBet === activeChallenge.ChallengedBet
			? activeChallenge.ChallengerId : activeChallenge.ChallengedId;

		await this._watoDatabase.completeChallenge(activeChallenge, winnerId);

		const originalChannel = msg.getClientChannel(activeChallenge.ChannelId);
		if (!originalChannel) { return; }

		const resultsEmbed = await this._watoHelper.createWatoResultsEmbed(winnerId, activeChallenge, msg.getClient());
		(originalChannel as TextChannel).send(resultsEmbed);
	}
}
