import { inject, injectable } from 'inversify';

import { MessageHandler, MessageHandlerPredicate } from '../../../models/message-handler';
import { SYMBOLS } from '../../../types';
import { combinePredicates, DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { Stats } from '../models/stats';
import { WatoHelperService } from '../services/wato-helper.service';

@injectable()
export class WATOLeaderboardMessageHandler implements MessageHandler {
	constructor(
		@inject(SYMBOLS.PredicateHelper) private _predicateHelper: PredicateHelper,
		@inject(SYMBOLS.WATODatabase) private _watoDatabase: WATODatabase,
		@inject(SYMBOLS.WatoHelperService) private _watoHelper: WatoHelperService
	) { }

	createHandlerPredicate(): MessageHandlerPredicate {
		return combinePredicates(
			this._predicateHelper.createRegexPredicate(REGEX.WATO_LEADERBOARD)
		);
	}

	async handleMessage(msg: DiscordMessage): Promise<void> {
		const finishedChallenges = await this._watoDatabase.getAllFinishedChallenges();

		const topThreeRankings = this.generateTopThree(msg, finishedChallenges);
		const embed = this._watoHelper.createWatoTopRankingsEmbed(topThreeRankings);
		msg.getChannel().send(embed);
	}

	private generateTopThree(msg: DiscordMessage, challenges: Challenge[]): Stats[] {
		const userStats: Record<string, Stats> = {};
		challenges.forEach(challenge => {
			if (!userStats[challenge.ChallengerId]) {
				userStats[challenge.ChallengerId] = {
					User: msg.getGuildMember(challenge.ChallengerId)!.user,
					Wins: 0,
					Losses: 0
				};
			}
			if (!userStats[challenge.ChallengedId]) {
				userStats[challenge.ChallengedId] = {
					User: msg.getGuildMember(challenge.ChallengedId)!.user,
					Wins: 0,
					Losses: 0
				};
			}

			if (challenge.ChallengerId === challenge.WinnerId) {
				userStats[challenge.ChallengerId].Wins++;
				userStats[challenge.ChallengedId].Losses++;
			} else {
				userStats[challenge.ChallengedId].Wins++;
				userStats[challenge.ChallengerId].Losses++;
			}
		});

		return Object.values(userStats)
			.sort((a, b) => b.Wins - a.Wins)
			.slice(0, 5);
	}
}
