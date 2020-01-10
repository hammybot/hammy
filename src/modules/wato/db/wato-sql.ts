import { User } from 'discord.js';
import SQL from 'sql-template-strings';

import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';

export const createNewChallengeSql = (challenge: Challenge) => {
	return SQL`
		INSERT INTO public.challenges (
			"ChallengerId", "ChallengedId", "ChannelId", "Description", "Status"
		)
		VALUES (
			${challenge.ChallengerId}, ${challenge.ChallengedId}, ${challenge.ChannelId},
			${challenge.Description}, ${challenge.Status}
		);
	`;
};

export const getUserActiveChallengeSql = (user: User) => {
	return SQL`
		SELECT * FROM public.challenges
		WHERE ("ChallengerId" = ${user.id} OR "ChallengedId" = ${user.id})
			  AND "Status" NOT IN ('CMP', 'DEC');
	`;
};

export const setStatusMessageIdSql = (challenge: Challenge, statusMessageId: string) => {
	return SQL`
		UPDATE public.challenges
		SET "StatusMessageId"=${statusMessageId}
		WHERE "Id"=${challenge.Id};
	`;
};

export const setBetLimitSql = (challenge: Challenge, betLimit: number) => {
	return SQL`
		UPDATE public.challenges
		SET "Status"=${ChallengeStatus.PendingBets},
			"BetLimit"=${betLimit}
		WHERE "Id"=${challenge.Id};
	`;
};

export const setChallengerBetSql = (challenge: Challenge, bet: number) => {
	return SQL`
		UPDATE public.challenges
		SET "ChallengerBet"=${bet}
		WHERE "Id"=${challenge.Id};
	`;
};

export const setChallengedBetSql = (challenge: Challenge, bet: number) => {
	return SQL`
		UPDATE public.challenges
		SET "ChallengedBet"=${bet}
		WHERE "Id"=${challenge.Id};
	`;
};

export const declineChallengeSql = (challenge: Challenge) => {
	return SQL`
		UPDATE public.challenges
		SET "Status"=${ChallengeStatus.Declined},
			"CompletedTimestamp"=now()
		WHERE "Id"=${challenge.Id};
	`;
};

export const completeChallengeSql = (challenge: Challenge, winnerId: string) => {
	return SQL`
		UPDATE public.challenges
		SET "Status"=${ChallengeStatus.Completed},
			"WinnerId"=${winnerId},
			"CompletedTimestamp"=now()
		WHERE "Id"=${challenge.Id};
	`;
};
