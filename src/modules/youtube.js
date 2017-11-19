const createYoutubeStream = require('ytdl-core');
const commands = require('../utils/commands');

const playYoutube = message => {
    var ytUrl = message.content.match(commands.PLAY_YOUTUBE);
    if(!ytUrl || !ytUrl[0] || !message.guild) {
        return;
    }

    if(!message.member.voiceChannel) {
        message.reply('You need to join a voice channel first.');
        return;
    }

    message.member.voiceChannel.join().then(connection => {
        const stream = createYoutubeStream(ytUrl[0], { filter : 'audioonly' });
        const dispatcher = connection.playStream(stream);
        
        dispatcher.on('end', () => {
            dispatcher.end();
        
            message.member.voiceChannel.leave();
        });
    }).catch(console.log);
}

module.exports = {
    playYoutube: playYoutube
}