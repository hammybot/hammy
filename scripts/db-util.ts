import { config } from 'dotenv';
import { Client } from 'pg';
import { createdb, dropdb } from 'pgtools';
import { SQL } from 'sql-template-strings';

config();

const dbConfig = {
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	host: process.env.PGHOST
};

const createDatabase = (dbName: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		createdb(config, dbName, (err: any) => {
			if (err) {
				reject(err);
			}
			console.log(`Database created: '${dbName}'`);
			resolve();
		});
	});
};

const createHammyTables = async () => {
	// const client = new Client();
	// client.connect();

	// const sql = SQL`SELECT author FROM books WHERE name = ${1} AND author = ${2}`;
	// console.log(sql);
	// process.exit(0);
	// const createTable = client.query(

	// );
	// createTable.on('end', () => {
	// 	client.end();
	// 	process.exit(0);
	// });
};

const dropHammyTables = async () => {

};

const dropDatabase = async (dbName: string) => {
	return new Promise((resolve, reject) => {
		if (process.env.NODE_ENV !== 'development') {
			reject(new Error('I refuse to drop a database unless you\'re in development'));
		}

		dropdb(dbConfig, dbName, (err: any, res: any) => {
			if (err) {
				reject(err);
			}
			console.log(`Database dropped: '${dbName}'`);
			resolve();
		});
	});
};

const processDatabaseCommands = async () => {
	const databaseName = process.env.PGDATABASE;
	if (!databaseName) {
		throw new Error('PGDATABASE Environment variable is required!');
	}

	const createDb = process.argv.indexOf('--create-db') > -1;
	const createTables = process.argv.indexOf('--create-tables') > -1;
	const dropTables = process.argv.indexOf('--drop-tables') > -1;
	const dropDb = process.argv.indexOf('--drop-db') > -1;

	if (createDb) {
		await createDatabase(databaseName);
	}
	if (createTables) {
		await createHammyTables();
	}
	if (dropTables) {
		await dropHammyTables();
	}
	if (dropDb) {
		await dropDatabase(databaseName);
	}
};

processDatabaseCommands().then(() => {
	process.exit(0);
}).catch((err) => {
	console.error(err);
	process.exit(1);
});
