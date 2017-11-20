const youtube = require('./modules/youtube');
const ping = require('./modules/ping');
const playback = require('./modules/media-playback');

const Dispatcher = require('./utils/Dispatcher');
const CONSTANTS = require('./utils/constants');

const Environment = require('dotenv');
Environment.config();

const messageDispatcher = new Dispatcher();

messageDispatcher.register({
    regex: CONSTANTS.COMMANDS.PING,
    callback: ping.sendPing
});

messageDispatcher.register({
    regex: CONSTANTS.COMMANDS.PLAY_YOUTUBE,
    callback: youtube.playYoutube
});

messageDispatcher.register({
    regex: CONSTANTS.COMMANDS.PAUSE,
    callback: playback.pause
});

messageDispatcher.register({
    regex: CONSTANTS.COMMANDS.RESUME,
    callback: playback.resume
});

messageDispatcher.register({
    regex: CONSTANTS.COMMANDS.STOP,
    callback: playback.stop
});