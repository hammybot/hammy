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
