const createYoutubeStream = require('ytdl-core');
const commands = require('../utils/commands');

const playYoutube = message => {
    var ytUrl = message.content.match(commands.PLAY_YOUTUBE);
    if(!ytUrl || !ytUrl[0] || !message.guild) {
        return;
    }

    const voiceChannel = message.member.voiceChannel;

    if(!voiceChannel) {
        message.reply('You need to join a voice channel first.');
        return;
    }

    if(voiceChannel.connection) {
        message.reply('I\'m already playing music!');
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