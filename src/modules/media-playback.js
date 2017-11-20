const MESSAGES = require('../utils/messages');

const pause = msg => {
    if(isValidVoiceConnection(msg)){
        msg.member.voiceChannel.connection.dispatcher.pause();
    }
}

const resume = msg => {
    if(isValidVoiceConnection(msg)){
        msg.member.voiceChannel.connection.dispatcher.resume();
    }
}

const stop = msg => {
    if(isValidVoiceConnection(msg)){
        msg.member.voiceChannel.connection.dispatcher.end();
    }
}

const isValidVoiceConnection = (msg) => {
    const voiceChannel = msg.member.voiceChannel;

    if(!voiceChannel) {
        msg.reply(MESSAGES.NO_VOICE_CHANNEL);
        return false;
    }

    if(!voiceChannel.connection || !voiceChannel.connection.dispatcher) {
        msg.reply(MESSAGES.NO_VOICE_CONNECTION);
        return false;
    }

    return true;
}

module.exports = {
    pause: pause,
    resume: resume,
    stop: stop
}