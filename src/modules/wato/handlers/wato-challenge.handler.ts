import { Message, MessageMentions, RichEmbed, User } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, MESSAGE_TARGETS, PredicateHelper } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATOChallengeMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createUniqueMentionsPredicate(1, true),
			this._predicateHelper.createContainsPredicate(MESSAGE_TARGETS.WATO_CHALLENGE, false)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const challenger = msg.getAuthorUser();
		const challenged = msg.getMentionedUsers().values().next().value as User;
		const channel = msg.getChannel();

		const validationEmbed = await this.runValidation(challenger, challenged);
		if (validationEmbed) { await channel.send(validationEmbed); return; }

		const challenge: Challenge = {
			ChallengerId: challenger.id,
			ChallengedId: challenged.id,
			ChannelId: channel.id,
			Description: this.removeMentions(msg.getContent()),
			Status: ChallengeStatus.PendingAccept
		};

		await this._watoDatabase.createNewChallenge(challenge);

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (!activeChallenge) { return; }

		const statusEmbed = await this._watoHelper.createWatoStatusEmbed(
			activeChallenge.ChallengerId, activeChallenge.ChallengedId, activeChallenge.Status,
			activeChallenge.Description, msg.getClient()
		);

		const statusMessage = await channel.send(statusEmbed) as Message;
		await this._watoDatabase.setStatusMessageId(activeChallenge, statusMessage.id);
	}

	private async runValidation(challenger: User, challenged: User): Promise<RichEmbed | undefined> {
		if (challenger.bot || challenged.bot) {
			return this._watoHelper.createWatoValidationEmbed(`Bot's can't play the odds game...`);
		}

		if (challenger.id === challenged.id) {
			return this._watoHelper.createWatoValidationEmbed(`You can't challenge yourself.`);
		}

		const challengerActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (challengerActiveChallenge) {
			return this._watoHelper.createWatoValidationEmbed(`You're already in a challenge! Finish that one first.`);
		}

		const challengedActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenged);
		if (challengedActiveChallenge) {
			return this._watoHelper.createWatoValidationEmbed(
				`<@${challenged.id}> is already in a challenge! They need to finish that one first.`
			);
		}
	}

	private removeMentions(message: string): string {
		return message.replace(MessageMentions.USERS_PATTERN, '').trim();
	}
}
