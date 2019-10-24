import { Message, User } from 'discord.js';
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
import { createWatoStatusEmbed } from './wato-helper';

@injectable()
export class WATOChallengeMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase) { }

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
			await message.channel.send(`Hey <@${challenger.id}>! Bot's can't play the odds game...`);
			return;
		}

		const challengedActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenged);
		if (challengedActiveChallenge) {
			await message.channel.send(`<@${challenged.id}> is currently in a challenge! They need to finish that one first.`);
			return;
		}

		const challengerActiveChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (challengerActiveChallenge) {
			await message.channel.send(`You're currently in a challenge! Finish that one first.`);
			return;
		}

		const challenge: Challenge = {
			ChallengerId: challenger.id,
			ChallengedId: challenged.id,
			ChannelId: message.channel.id,
			Description: message.cleanContent,
			Status: ChallengeStatus.PendingAccept
		};

		await this._watoDatabase.createNewChallenge(challenge);

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(challenger);
		if (!activeChallenge) { return; }

		const statusEmbed = await createWatoStatusEmbed(activeChallenge, message.client);

		const statusMessage = await message.channel.send(statusEmbed) as Message;
		await this._watoDatabase.setStatusMessageId(activeChallenge, statusMessage.id);
	}
}
