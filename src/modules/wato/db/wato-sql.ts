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

export const declineChallengeSql = (challenge: Challenge) => {
	return SQL`
		UPDATE public.challenges
		SET "Status"=${ChallengeStatus.Declined}
		WHERE "Id"=${challenge.Id};
	`;
};
