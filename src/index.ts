import { config } from 'dotenv';

import { closeDbPool } from './db';
import {
	MediaPause,
	MediaResume,
	MediaStop,
	PlayYoutube,
	SendPing,
	WATOChallenge
} from './modules';
import {
	combineMatchers,
	COMMANDS,
	createContainsMatcher,
	createRegexMatcher,
	createUniqueMentionsMatcher,
	Dispatcher,
	MESSAGE_TARGETS
} from './utils';

config();

const messageDispatcher = new Dispatcher();

messageDispatcher.register({
	matcher: createRegexMatcher(COMMANDS.PING),
	callback: SendPing
});

messageDispatcher.register({
	matcher: createRegexMatcher(COMMANDS.PLAY_YOUTUBE),
	callback: PlayYoutube
});

messageDispatcher.register({
	matcher: createRegexMatcher(COMMANDS.PAUSE),
	callback: MediaPause
});

messageDispatcher.register({
	matcher: createRegexMatcher(COMMANDS.RESUME),
	callback: MediaResume
});

messageDispatcher.register({
	matcher: createRegexMatcher(COMMANDS.STOP),
	callback: MediaStop
});

messageDispatcher.register({
	matcher: combineMatchers(
		createUniqueMentionsMatcher(1, true),
		createContainsMatcher(MESSAGE_TARGETS.WATO_CHALLENGE, false)
	),
	callback: WATOChallenge
});


// Process exiting cleanup code
const exitHandler = (options: any, exitCode: any) => {
	if (options.exit) {
		closeDbPool().finally(() => process.exit());
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
