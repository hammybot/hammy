export const BOT_MESSAGES = {
	PONG: ':ping_pong: Pong!',
	NO_VOICE_CHANNEL: 'You need to join a voice channel first.',
	NO_VOICE_CONNECTION: 'I\'m not playing music!',
	ALREADY_PLAYING: 'I\'m already playing music!',
	ERROR_OCCURED: 'Something went wrong, I can\'t complete that request right now :disappointed:'
};

export const REGEX = {
	COMMAND_PING: /^!ping$/,
	COMMAND_PAUSE: /^!pause$/,
	COMMAND_RESUME: /^!resume$/,
	COMMAND_STOP: /^!stop$/,
	COMMAND_PLAY_YOUTUBE: /^(!play )(https?\:\/\/)?((www\.)?youtube\.com|youtu\.?be)\/.+$/,
	VALID_NUMBER: /(?<=\s|^)-?\d+/
};

export const MESSAGE_TARGETS = {
	WATO_CHALLENGE: 'what are the odds',
	WATO_DECLINE: 'decline'
};
