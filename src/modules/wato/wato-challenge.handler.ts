import { Message, MessageMentions, User } from 'discord.js';
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
import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';
import { WatoHelperService } from './wato-helper.service';

@injectable()
export class WATOChallengeMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	messageHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			createChannelTypePredicate('text'),
			createUniqueMentionsPredicate(1, true),
			createContainsPredicate(MESSAGE_TARGETS.WATO_CHALLENGE, false)
		);
	}

	async handleMessage(message: Message): Promise<void> {

		const challenger = message.author;
		const challenged = message.mentions.users.values().next().value as User;

		if (challenger.bot || challenged.bot) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`Bot's can't play the odds game...`);
			await message.channel.send(validationEmbed);
			return;
		}

		const challengedActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenged);
		if (challengedActiveChallenge) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(
				`<@${challenged.id}> is already in a challenge! They need to finish that one first.`
			);
			await message.channel.send(validationEmbed);
			return;
		}

		const challengerActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (challengerActiveChallenge) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`You're already in a challenge! Finish that one first.`);
			await message.channel.send(validationEmbed);
			return;
		}

		const challenge: Challenge = {
			ChallengerId: challenger.id,
			ChallengedId: challenged.id,
			ChannelId: message.channel.id,
			Description: this.removeMentions(message.content),
			Status: ChallengeStatus.PendingAccept
		};

		await this._watoDatabase.createNewChallenge(challenge);

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (!activeChallenge) { return; }

		const statusEmbed = await this._watoHelper.createWatoStatusEmbed(activeChallenge, message.client);

		const statusMessage = await message.channel.send(statusEmbed) as Message;
		await this._watoDatabase.setStatusMessageId(activeChallenge, statusMessage.id);
	}

	private removeMentions(message: string): string {
		return message.replace(MessageMentions.USERS_PATTERN, '').trim();
	}
}
