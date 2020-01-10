import { Client, RichEmbed, User } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATOHelpMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createRegexPredicate(REGEX.WATO_HELP)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const author = msg.getAuthorUser();
		const client = msg.getClient();

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);

		const helpEmbed = await this.getHelpMessage(activeChallenge, author, client);
		author.send(helpEmbed);
	}

	private async getHelpMessage(activeChallenge: Challenge | null, author: User, client: Client): Promise<RichEmbed> {
		if (!activeChallenge) { return this._watoHelper.createGenericWatoHelpMessage(author.username, client.user.username); }

		const authorIsChallenger = activeChallenge.ChallengerId === author.id;
		const opponent = await client.fetchUser(authorIsChallenger ? activeChallenge.ChallengedId : activeChallenge.ChallengerId);

		if (!opponent) { return this._watoHelper.createGenericWatoHelpMessage(author.username, client.user.username); }

		switch (activeChallenge.Status) {
			case ChallengeStatus.PendingAccept:
				if (authorIsChallenger) {
					return this._watoHelper.createWaitingOnOpponentAcceptHelpMessage(author, opponent);
				}
				return this._watoHelper.createWaitingOnAuthorAcceptHelpMessage(opponent);
			case ChallengeStatus.PendingBets:
				if (
					(!activeChallenge.ChallengedBet && !activeChallenge.ChallengerBet) ||
					(authorIsChallenger && !activeChallenge.ChallengerBet) ||
					(!authorIsChallenger && !activeChallenge.ChallengedBet)
				) {
					return this._watoHelper.createWaitingOnAuthorBetHelpMessage();
				}
				return this._watoHelper.createWaitingOnOpponentBetHelpMessage(opponent);
			default:
				return this._watoHelper.createGenericWatoHelpMessage(author.username, client.user.username);
		}
	}
}
