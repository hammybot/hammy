import { config } from 'dotenv';

import { closeDbPool } from './db';
import {
	MediaPause,
	MediaResume,
	MediaStop,
	PlayYoutube,
	SendPing,
	WATOBetResponse,
	WATOChallenge,
	WATOChallengeDecline,
	WATOChallengeResponse
} from './modules';
import {
	combineMatchers,
	createChannelTypeMatcher,
	createContainsMatcher,
	createRegexMatcher,
	createUniqueMentionsMatcher,
	Dispatcher,
	MESSAGE_TARGETS,
	REGEX
} from './utils';

config();

const messageDispatcher = new Dispatcher();

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createRegexMatcher(REGEX.COMMAND_PING)
	),
	callback: SendPing
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createRegexMatcher(REGEX.COMMAND_PLAY_YOUTUBE)
	),
	callback: PlayYoutube
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createRegexMatcher(REGEX.COMMAND_PAUSE)
	),
	callback: MediaPause
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createRegexMatcher(REGEX.COMMAND_RESUME)
	),
	callback: MediaResume
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createRegexMatcher(REGEX.COMMAND_STOP)
	),
	callback: MediaStop
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createUniqueMentionsMatcher(1, true),
		createContainsMatcher(MESSAGE_TARGETS.WATO_CHALLENGE, false)
	),
	callback: WATOChallenge
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createUniqueMentionsMatcher(1, true),
		createRegexMatcher(REGEX.VALID_NUMBER)
	),
	callback: WATOChallengeResponse
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('text'),
		createUniqueMentionsMatcher(1, true),
		createContainsMatcher(MESSAGE_TARGETS.WATO_DECLINE, false)
	),
	callback: WATOChallengeDecline
});

messageDispatcher.register({
	matcher: combineMatchers(
		createChannelTypeMatcher('dm'),
		createRegexMatcher(REGEX.VALID_NUMBER)
	),
	callback: WATOBetResponse
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
