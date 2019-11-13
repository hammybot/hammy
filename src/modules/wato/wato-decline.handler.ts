import { Message, TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../models/message-handler';
import { SYMBOLS } from '../../types';
import {
	combinePredicates,
	createChannelTypePredicate,
	createContainsPredicate,
	createUniqueMentionsPredicate,
	MESSAGE_TARGETS
} from '../../utils';

import { WATODatabase } from './db/wato-database';
import { ChallengeStatus } from './models/challenge-status';
import { WatoHelperService } from './wato-helper.service';

@injectable()
export class WATODeclineMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createUniqueMentionsPredicate(1, true),
			createContainsPredicate(MESSAGE_TARGETS.WATO_DECLINE, false)
		);
	}

	async handleMessage(message: Message): Promise<void> {
		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(message.author);
		if (!activeChallenge ||
			activeChallenge.Status !== ChallengeStatus.PendingAccept ||
			activeChallenge.ChallengedId !== message.author.id) { return; }

		await this._watoDatabase.declineChallenge(activeChallenge);

		const originalChannel = message.client.channels.get(activeChallenge.ChannelId) as TextChannel;
		if (!originalChannel) { return; }

		const statusMessage = await originalChannel.fetchMessage(activeChallenge.StatusMessageId as string);

		// workaround for now
		activeChallenge.Status = ChallengeStatus.Declined;
		const newStatusEmbed = await this._watoHelper.createWatoStatusEmbed(activeChallenge, message.client);
		statusMessage.edit(newStatusEmbed);
	}
}
