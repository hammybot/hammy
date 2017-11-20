const createYoutubeStream = require('ytdl-core');
const CONSTANTS = require('../utils/constants');

const playYoutube = msg => {
    var ytUrl = msg.content.match(CONSTANTS.COMMANDS.PLAY_YOUTUBE);
    if(!ytUrl || !ytUrl[0] || !msg.guild) {
        return;
    }

    const voiceChannel = msg.member.voiceChannel;

    if(!voiceChannel) {
        msg.reply(CONSTANTS.BOT_MESSAGES.NO_VOICE_CHANNEL);
        return;
    }

    if(voiceChannel.connection) {
        msg.reply(CONSTANTS.BOT_MESSAGES.ALREADY_PLAYING);
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