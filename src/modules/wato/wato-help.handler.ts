import { Message, MessageEmbed, RichEmbed, User } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import { combinePredicates, createRegexPredicate, REGEX } from '../../utils';

import { WATODatabase } from './db/wato-database';
import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';
import { WatoHelperService } from './wato-helper.service';

@injectable()
export class WATOHelpMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createRegexPredicate(REGEX.WATO_HELP)
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(message.author);

		message.author.send(this.getHelpMessage(activeChallenge, message.author, message.client.user));
	}

	private getHelpMessage(activeChallenge: Challenge | null, author: User, bot: User): RichEmbed {
		if (!activeChallenge) { return this._watoHelper.createGenericWatoHelpMessage(author.username, bot.username); }

		const authorIsChallenger = activeChallenge.ChallengerId === author.id;
		switch (activeChallenge.Status) {
			case ChallengeStatus.PendingAccept:
				if (authorIsChallenger) {
					return this._watoHelper.createWaitingOnOpponentAcceptHelpMessage();
				}
				return this._watoHelper.createWaitingOnAuthorAcceptHelpMessage();
			case ChallengeStatus.PendingBets:
				if (!activeChallenge.ChallengedBet && !activeChallenge.ChallengerBet) {
					return this._watoHelper.createWaitingOnBothBetsHelpMessage();
				}
				if (authorIsChallenger && !activeChallenge.ChallengerBet) {
					return this._watoHelper.createWaitingOnAuthorBetHelpMessage();
				}
				return this._watoHelper.createWaitingOnOpponentBetHelpMessage();
			default:
				return this._watoHelper.createGenericWatoHelpMessage(author.username, bot.username);
		}
	}
}
