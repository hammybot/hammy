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
        msg.reply('You need to join a voice channel first.');
        return false;
    }

    if(!voiceChannel.connection || !voiceChannel.connection.dispatcher) {
        msg.reply('I\'m not playing music!');
        return false;
    }

    return true;
}

module.exports = {
    pause: pause,
    resume: resume,
    stop: stop
}