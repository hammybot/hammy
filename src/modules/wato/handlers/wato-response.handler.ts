import { TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATOResponseMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createChannelTypePredicate('text'),
			this._predicateHelper.createUniqueMentionsPredicate(1, true),
			this._predicateHelper.createRegexPredicate(REGEX.VALID_NUMBER)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const author = msg.getAuthorUser();
		const channel = msg.getChannel();

		const challengeResponse = msg.getCleanContent().match(REGEX.VALID_NUMBER);
		if (!challengeResponse || !challengeResponse[0]) { return; }

		const betLimit = Number(challengeResponse[0]);

		const activeChallenge = await this._watoDatabase.getUserActiveChallenge(author);
		if (!activeChallenge ||
			activeChallenge.Status !== ChallengeStatus.PendingAccept ||
			activeChallenge.ChallengedId !== author.id) { return; }

		if (!Number.isSafeInteger(betLimit) || betLimit <= 1 || betLimit > Number.MAX_SAFE_INTEGER) {
			const validationEmbed = this._watoHelper.createWatoValidationEmbed(`
			<@${author.id}> Your bet needs to be between 1 and 9,007,199,254,740,991
			`);
			await channel.send(validationEmbed);
			return;
		}

		await this._watoDatabase.setBetLimit(activeChallenge, betLimit);

		const challenger = msg.getGuildMember(activeChallenge.ChallengerId);
		const challenged = msg.getGuildMember(activeChallenge.ChallengedId);

		if (!challenger || !challenged) { return; }

		await challenger.send(this._watoHelper.createWatoDmEmbed(challenged.user.username, betLimit, activeChallenge));
		await challenged.send(this._watoHelper.createWatoDmEmbed(challenger.user.username, betLimit, activeChallenge));

		const originalChannel = msg.getClientChannel(activeChallenge.ChannelId);
		if (!originalChannel) { return; }

		const statusMessage = await (originalChannel as TextChannel).fetchMessage(activeChallenge.StatusMessageId as string);

		// workaround for now
		activeChallenge.Status = ChallengeStatus.PendingBets;
		const newStatusEmbed = await this._watoHelper.createWatoStatusEmbed(activeChallenge, msg.getClient());
		statusMessage.edit(newStatusEmbed);
	}
}
