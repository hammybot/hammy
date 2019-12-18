import { config } from 'dotenv';
config();

// Have to run the configuration step before the container runs
// tslint:disable-next-line: ordered-imports
import { Pool } from 'pg';
import { Bot } from './core/bot';
import container from './core/inversify.config';
import { SYMBOLS } from './types';

const bot = container.get<Bot>(SYMBOLS.Bot);
bot.startBot().then(() => {
	console.log('hammy ready!');
}).catch((error) => {
	console.error(error);
});

const dbPool = container.get<Pool>(SYMBOLS.DbPool);
dbPool.on('error', (err) => {
	console.error('DB Pool: Unexpected error on idle db client', err);
});

// Process exiting cleanup code
const exitHandler = (options: any, exitCode: any) => {
	if (options.exit) {
		dbPool.end().then(() => {
			console.log('DB Pool: Connection successfully closed');
			process.exit();
		});
	}
};

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
