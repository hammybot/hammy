import { User } from 'discord.js';

import { getDbPool } from '../../../db';
import { Challenge } from '../models/challenge';

import { createNewChallengeSql, declineChallengeSql, getUserActiveChallengeSql, setBetLimitSql } from './wato-sql';

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

export const declineChallenge = async (challenge: Challenge): Promise<void> => {
	const pool = getDbPool();
	try {
		await pool.query(declineChallengeSql(challenge));
	} catch (error) {
		throw error;
	}
};
