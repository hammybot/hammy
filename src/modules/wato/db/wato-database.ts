import { User } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Pool } from 'pg';

import { SYMBOLS } from '../../../types';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';

import {
	completeChallengeSql,
	createNewChallengeSql,
	getUserActiveChallengeSql,
	setBetLimitSql,
	setChallengedBetSql,
	setChallengerBetSql,
	setStatusMessageIdSql,
	updateChallengeStatusSql
} from './wato-sql';

@injectable()
export class WATODatabase {
	constructor(@inject(SYMBOLS.DbPool) private _pool: Pool) { }

	async createNewChallenge(challenge: Challenge): Promise<void> {
		await this._pool.query(createNewChallengeSql(challenge));
	}

	async getUserActiveChallenge(user: User): Promise<Challenge | null> {
		const result = await this._pool.query(getUserActiveChallengeSql(user));
		if (result.rowCount === 0) { return null; }

		return result.rows[0];
	}

	async setStatusMessageId(challenge: Challenge, statusMessageId: string) {
		await this._pool.query(setStatusMessageIdSql(challenge, statusMessageId));
	}

	async setBetLimit(challenge: Challenge, betLimit: number): Promise<void> {
		await this._pool.query(setBetLimitSql(challenge, betLimit));
	}

	async setChallengerBet(challenge: Challenge, bet: number): Promise<void> {
		await this._pool.query(setChallengerBetSql(challenge, bet));
	}

	async setChallengedBet(challenge: Challenge, bet: number): Promise<void> {
		await this._pool.query(setChallengedBetSql(challenge, bet));
	}

	async declineChallenge(challenge: Challenge): Promise<void> {
		await this._pool.query(updateChallengeStatusSql(challenge, ChallengeStatus.Declined));
	}

	async completeChallenge(challenge: Challenge, winnerId: string): Promise<void> {
		await this._pool.query(completeChallengeSql(challenge, winnerId));
	}
}
