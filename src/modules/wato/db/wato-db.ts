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
	try {
		await pool.query(createNewChallengeSql(challenge));
	} catch (error) {
		throw error;
	}
};

export const getUserActiveChallenge = async (user: User): Promise<Challenge | null> => {
	const pool = getDbPool();
	try {
		const result = await pool.query(getUserActiveChallengeSql(user));
		if (result.rowCount === 0) { return null; }

		return result.rows[0];
	} catch (error) {
		throw error;
	}
};

export const setBetLimit = async (challenge: Challenge, betLimit: number): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(setBetLimitSql(challenge, betLimit));
	} catch (error) {
		throw error;
	}
};

export const setChallengerBet = async (challenge: Challenge, bet: number): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(setChallengerBetSql(challenge, bet));
	} catch (error) {
		throw error;
	}
};

export const setChallengedBet = async (challenge: Challenge, bet: number): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(setChallengedBetSql(challenge, bet));
	} catch (error) {
		throw error;
	}
};

export const declineChallenge = async (challenge: Challenge): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(updateChallengeStatusSql(challenge, ChallengeStatus.Declined));
	} catch (error) {
		throw error;
	}
};

export const completeChallenge = async (challenge: Challenge, winnerId: string): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(completeChallengeSql(challenge, winnerId));
	} catch (error) {
		throw error;
	}
};
