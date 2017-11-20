const createYoutubeStream = require('ytdl-core');
const commands = require('../utils/commands');

const MESSAGES = require('../utils/messages');

const playYoutube = msg => {
    var ytUrl = msg.content.match(commands.PLAY_YOUTUBE);
    if(!ytUrl || !ytUrl[0] || !msg.guild) {
        return;
    }

    const voiceChannel = msg.member.voiceChannel;

    if(!voiceChannel) {
        msg.reply(MESSAGES.NO_VOICE_CHANNEL);
        return;
    }

    if(voiceChannel.connection) {
        msg.reply(MESSAGE.ALREADY_PLAYING);
        return;
    }

    voiceChannel.join().then(connection => {
        const stream = createYoutubeStream(ytUrl[0], { filter : 'audioonly' });
        const dispatcher = connection.playStream(stream);
        
        dispatcher.on('end', () => {
            dispatcher.end();
        
            voiceChannel.leave();
        });
    }).catch(console.log);
}

module.exports = {
    playYoutube: playYoutube
}