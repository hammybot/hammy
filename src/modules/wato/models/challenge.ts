import { ChallengeStatus } from './challenge-status';

export interface Challenge {
	Id?: number;
	ChallengerId: string;
	ChallengedId: string;
	ChannelId: string;
	StatusMessageId?: string;
	Description: string;
	Status: ChallengeStatus;
	BetLimit?: number | undefined;
	ChallengerBet?: number | undefined;
	ChallengedBet?: number | undefined;
}
