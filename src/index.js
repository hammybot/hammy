const Discord = require('discord.js');
const Environment = require('dotenv');
const ytdl = require('ytdl-core');

Environment.config();

const ytRegex = /^(!play )(https?\:\/\/)?((www\.)?youtube\.com|youtu\.?be)\/.+$/;

const client = new Discord.Client({
    disabledEvents: ["TYPING_START"]
});

const token = process.env.APOLLO_DISCORD_TOKEN;

if(!token) {
    throw new Error('Please generate a discord token and store in "APOLLO_DISCORD_TOKEN" environment variable.');
}

client.on('ready', () => {
    console.log('apollo ready!');
});

client.on('message', message => {
    console.log(`Recieved message: ${message}`);
    
    if(message.content === '!ping') {
        message.channel.send(':ping_pong: Pong!');
    }

    var ytUrl = message.content.match(ytRegex);
    if(ytUrl && ytUrl[0]) {
        if (!message.guild) return;

        if(message.member.voiceChannel) {
            message.member.voiceChannel.join().then(connection => {
                const stream = ytdl(ytUrl[0], { filter : 'audioonly' });
                const dispatcher = connection.playStream(stream);

                dispatcher.on('end', () => {
                    dispatcher.end();

                    message.member.voiceChannel.leave();
                });
            })
            .catch(console.log);
        } else {
            message.reply('You need to join a voice channel first.');
        }
    }
});

client.login(token);