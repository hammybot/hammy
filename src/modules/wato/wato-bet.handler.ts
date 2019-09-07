import { Message, TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, createChannelTypePredicate, createRegexPredicate, REGEX } from '../../utils';

import { WATODatabase } from './db/wato-database';
import { ChallengeStatus } from './models/challenge-status';

@injectable()
export class WATOBetMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase) { }

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
			await message.channel.send(`
			<@${message.author.id}> Your bet needs to be between 1 and ${activeChallenge.BetLimit}
		`);
			return;
		}

		if (activeChallenge.ChallengerId === message.author.id) {
			await this._watoDatabase.setChallengerBet(activeChallenge, bet);
		} else {
			await this._watoDatabase.setChallengedBet(activeChallenge, bet);
		}

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

		// tslint:disable-next-line: max-line-length
		originalChannel.send(`<@${activeChallenge.ChallengerId}> bet ${activeChallenge.ChallengerBet} and <@${activeChallenge.ChallengedId}> bet ${activeChallenge.ChallengedBet}`);
		originalChannel.send(`<@${winnerId}> is the winner!`);
	}
}
