const EventEmitter = require('events');
const Discord = require('discord.js');

class Dispatcher extends EventEmitter {
	constructor() {
		super();

		const discordToken = process.env.DISCORD_BOT_TOKEN;
		const youtubeApiToken = process.env.YOUTUBE_API_KEY;
		if (!discordToken) {
			throw new Error('Please generate a discord token and store in "DISCORD_BOT_TOKEN" environment file.');
		}
		if (!youtubeApiToken) {
			throw new Error('Please generate a youtube api token and store in "YOUTUBE_API_KEY" environment file.');
		}
		this.messageRecievers = [];

		this.client = new Discord.Client({
			disabledEvents: ["TYPING_START"]
		});

		this.client.on('ready', () => console.log('hammy ready!'));

		this.client.login(discordToken).then((str) => {
			this.initialize();
		});
	}

	initialize() {
		this.botId = this.client.user.id;

		this.client.on('message', message => {
			if (message.author.id === this.botId) {
				return;
			}

			console.log(`Recieved message: ${message}`);

			this.messageRecievers.forEach(reciever => {
				if (message.content.match(reciever.regex)) {
					reciever.callback(message);
				}
			});
		});
	}

	register(reciever) {
		if (!reciever.regex || !reciever.callback) {
			throw new Error('"regex" or "callback" property is missing');
		}

		this.messageRecievers.push(reciever);
	}
}

module.exports = Dispatcher;
