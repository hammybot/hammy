const createYoutubeStream = require('ytdl-core');
const CONSTANTS = require('../utils/constants');
const Youtube = require('youtube-node');

const playYoutube = msg => {
    var ytUrl = msg.content.match(CONSTANTS.COMMANDS.PLAY_YOUTUBE);
    if (!ytUrl || !ytUrl[0] || !msg.guild) {
        return;
    }

    const voiceChannel = msg.member.voiceChannel;

    if (!voiceChannel) {
        msg.reply(CONSTANTS.BOT_MESSAGES.NO_VOICE_CHANNEL);
        return;
    }

    if (voiceChannel.connection) {
        msg.reply(CONSTANTS.BOT_MESSAGES.ALREADY_PLAYING);
        return;
    }

    voiceChannel.join().then(connection => {
        const stream = createYoutubeStream(ytUrl[0], { filter: 'audioonly' });
        const dispatcher = connection.playStream(stream);

        dispatcher.on('end', () => {
            dispatcher.end();

            voiceChannel.leave();
        });
    }).catch(console.log);
}

const searchYoutube = msg => {
    const numResponses = 5;
    var matchSearch = msg.content.match(CONSTANTS.COMMANDS.SEARCH_YOUTUBE);
    if (!matchSearch || !msg.guild) {
        return;
    }
    let searchTerm = matchSearch[1];
    let youtubeClient = new Youtube();
    youtubeClient.setKey(process.env.GOOGLE_API_KEY);

    youtubeClient.search(searchTerm, numResponses, function (err, results) {
        if (err) {
            console.log(err);
        }

        let titles = results.items.map((item, index) => {
            return (index + 1) + ") " + item.snippet.title;
        });

        let response = 'Here are the top '+ numResponses+ ' results for your search "' + searchTerm + '":\r'

        msg.reply(response + titles.join(',\r'))
    });
}

module.exports = {
    playYoutube: playYoutube,
    searchYoutube: searchYoutube
}