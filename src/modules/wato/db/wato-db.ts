import { User } from 'discord.js';

import { getDbPool } from '../../../db';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';

import {
	completeChallengeSql,
	createNewChallengeSql,
	getUserActiveChallengeSql,
	setBetLimitSql,
	setChallengedBetSql,
	setChallengerBetSql,
	updateChallengeStatusSql
} from './wato-sql';

export const createNewChallenge = async (challenge: Challenge): Promise<void> => {
	const pool = getDbPool();
	await pool.query(createNewChallengeSql(challenge));
};

export const getUserActiveChallenge = async (user: User): Promise<Challenge | null> => {
	const pool = getDbPool();
	const result = await pool.query(getUserActiveChallengeSql(user));
	if (result.rowCount === 0) { return null; }

	return result.rows[0];
};

export const setBetLimit = async (challenge: Challenge, betLimit: number): Promise<void> => {
	const pool = getDbPool();
	await pool.query(setBetLimitSql(challenge, betLimit));
};

export const setChallengerBet = async (challenge: Challenge, bet: number): Promise<void> => {
	const pool = getDbPool();
	await pool.query(setChallengerBetSql(challenge, bet));
};

export const setChallengedBet = async (challenge: Challenge, bet: number): Promise<void> => {
	const pool = getDbPool();
	await pool.query(setChallengedBetSql(challenge, bet));
};

export const declineChallenge = async (challenge: Challenge): Promise<void> => {
	const pool = getDbPool();
	await pool.query(updateChallengeStatusSql(challenge, ChallengeStatus.Declined));
};

export const completeChallenge = async (challenge: Challenge, winnerId: string): Promise<void> => {
	const pool = getDbPool();
	await pool.query(completeChallengeSql(challenge, winnerId));
};
