const Discord = require('discord.js');
const Environment = require('dotenv');

Environment.config();

const client = new Discord.Client();

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
});

client.login(token);