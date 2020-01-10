import { ChallengeStatus } from './challenge-status';

export interface Challenge {
	Id?: number;
	ChallengerId: string;
	ChallengedId: string;
	ChannelId: string;
	StatusMessageId?: string;
	Description: string;
	Status: ChallengeStatus;
	BetLimit?: number;
	ChallengerBet?: number;
	ChallengedBet?: number;
	CreationTimestamp?: Date;
	CompletedTimestamp?: Date;
}
