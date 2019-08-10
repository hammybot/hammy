import { Snowflake } from 'discord.js';

import { ChallengeStatus } from './challenge-status';

export interface Challenge {
	Id?: number;
	ChallengerId: Snowflake;
	ChallengedId: Snowflake;
	ChannelId: Snowflake;
	Description: string;
	Status: ChallengeStatus;
	BetLimit?: number | undefined;
	ChallengerBet?: number | undefined;
	ChallengedBet?: number | undefined;
}
