import { Message } from 'discord.js';
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

@injectable()
export class WATODeclineMessageHandler implements MessageHandler {
	constructor(@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase) { }

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

		await message.channel.send(`
		<@${message.author.id}> has declined the challenge from <@${activeChallenge.ChallengerId}>
	`);
	}
}
