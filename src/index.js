const youtube = require('./modules/youtube');
const ping = require('./modules/ping');
const playback = require('./modules/media-playback');

const Dispatcher = require('./utils/Dispatcher');
const commands = require('./utils/commands');

const Environment = require('dotenv');
Environment.config();

const messageDispatcher = new Dispatcher();

messageDispatcher.register({
    regex: commands.PING,
    callback: ping.sendPing
});

messageDispatcher.register({
    regex: commands.PLAY_YOUTUBE,
    callback: youtube.playYoutube
});

messageDispatcher.register({
    regex: commands.PAUSE,
    callback: playback.pause
});

messageDispatcher.register({
    regex: commands.RESUME,
    callback: playback.resume
});

messageDispatcher.register({
    regex: commands.STOP,
    callback: playback.stop
});