import { config } from 'dotenv';
import { Pool } from 'pg';
import { createdb, dropdb } from 'pgtools';

import { createChallengesTable, createChallengeStatusType, deleteChallengesTable, deleteChallengeStatusType } from './db-schema';

config();

const _dbConfig = {
	schema: process.env.PGSCHEMA as string,
	databaseName: process.env.PGDATABASE as string,
	user: process.env.PGUSER as string,
	password: process.env.PGPASSWORD as string,
	port: process.env.PGPORT as string,
	host: process.env.PGHOST as string
};
// Global DB connection pool
const _dbPool = new Pool();

const createDatabase = (dbName: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		createdb(config, dbName, (err: any) => {
			if (err) {
				reject(err);
				return;
			}
			console.log(`Database created: '${dbName}'`);
			resolve();
		});
	});
};

const createHammySchema = async () => {
	const statusEnumSql = createChallengeStatusType(_dbConfig.schema, _dbConfig.user);
	const challengeTableSql = createChallengesTable(_dbConfig.schema, _dbConfig.user);
	const client = await _dbPool.connect();

	try {
		await client.query('BEGIN');

		await client.query(statusEnumSql);
		console.log(`Type created: 'challengestatus'`);

		await client.query(challengeTableSql);
		console.log(`Table created: 'challenges'`);

		await client.query('COMMIT');
		console.log(`Successfully created schema`);
	} catch (error) {
		await client.query('ROLLBACK');
		console.log(`Failed to create schema. Rolled back`);
		throw error;
	} finally {
		client.release();
	}
};

const dropHammySchema = async () => {
	const challengeTableSql = deleteChallengesTable(_dbConfig.schema);
	const statusEnumSql = deleteChallengeStatusType(_dbConfig.schema);
	const client = await _dbPool.connect();

	try {
		await client.query('BEGIN');

		await client.query(challengeTableSql);
		console.log(`Table dropped: 'challenges'`);

		await client.query(statusEnumSql);
		console.log(`Type dropped: 'challengestatus'`);

		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		console.log(`Failed to delete all tables. Rolled back`);
		throw error;
	} finally {
		client.release();
	}
};

const dropDatabase = async (dbName: string) => {
	return new Promise((resolve, reject) => {
		dropdb(_dbConfig, dbName, (err: any, res: any) => {
			if (err) {
				reject(err);
				return;
			}
			console.log(`Database dropped: '${dbName}'`);
			resolve();
		});
	});
};

const validateEnvironment = () => {
	if (process.env.NODE_ENV !== 'development') {
		throw new Error('I refuse to delete database objects unless you\'re in development');
	}
};

const processDatabaseCommands = async () => {
	if (!_dbConfig.databaseName) {
		throw new Error('PGDATABASE Environment variable is required!');
	}

	const createDb = process.argv.indexOf('--create-db') > -1;
	const createSchema = process.argv.indexOf('--create-schema') > -1;
	const dropSchema = process.argv.indexOf('--drop-schema') > -1;
	const dropDb = process.argv.indexOf('--drop-db') > -1;

	if (createDb) {
		await createDatabase(_dbConfig.databaseName);
	}
	if (createSchema) {
		await createHammySchema();
	}
	if (dropSchema) {
		validateEnvironment();
		await dropHammySchema();
	}
	if (dropDb) {
		validateEnvironment();
		await dropDatabase(_dbConfig.databaseName);
	}
};

const exitApp = (exitCode: number) => {
	// Close that DB connection
	_dbPool.end();
	process.exit(exitCode);
};

processDatabaseCommands().then(() => {
	exitApp(0);
}).catch((err) => {
	console.error(err);
	exitApp(1);
});
