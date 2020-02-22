import { TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, MESSAGE_TARGETS, PredicateHelper } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATODeclineMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createUniqueMentionsPredicate(1, true),
			this._predicateHelper.createContainsPredicate(MESSAGE_TARGETS.WATO_DECLINE, false)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const author = msg.getAuthorUser();

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);
		if (!activeChallenge ||
			activeChallenge.Status !== ChallengeStatus.PendingAccept ||
			activeChallenge.ChallengedId !== author.id) { return; }

		await this._watoDatabase.declineChallenge(activeChallenge);
		await this.updateWatoStatusMessage(msg, activeChallenge);
	}

	private async updateWatoStatusMessage(msg: DiscordMessage, challenge: Challenge) {
		const originalChannel = msg.getClientChannel(challenge.ChannelId) as TextChannel;
		if (!originalChannel) { return; }

		const challengerUser = msg.getGuildMember(challenge.ChallengerId)!;
		const challengedUser = msg.getGuildMember(challenge.ChallengedId)!;

		const newStatusEmbed = await this._watoHelper.createWatoStatusEmbed(
			challengerUser, challengedUser, ChallengeStatus.Declined, challenge.Description
		);

		const statusMessage = await originalChannel.fetchMessage(challenge.StatusMessageId as string);
		statusMessage.edit(newStatusEmbed);
	}
}
