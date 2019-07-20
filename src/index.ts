import { MediaPause, MediaResume, MediaStop } from './modules/media-playback';
import { SendPing } from './modules/ping';
import { PlayYoutube } from './modules/youtube';
import { COMMANDS } from './utils/constants';
import { Dispatcher } from './utils/Dispatcher';

const messageDispatcher = new Dispatcher();

messageDispatcher.register({
	regex: COMMANDS.PING,
	callback: SendPing
});

messageDispatcher.register({
	regex: COMMANDS.PLAY_YOUTUBE,
	callback: PlayYoutube
});

messageDispatcher.register({
	regex: COMMANDS.PAUSE,
	callback: MediaPause
});

messageDispatcher.register({
	regex: COMMANDS.RESUME,
	callback: MediaResume
});

messageDispatcher.register({
	regex: COMMANDS.STOP,
	callback: MediaStop
});
