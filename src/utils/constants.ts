export const BOT_MESSAGES = {
	PONG: ':ping_pong: Pong!'
};

export const REGEX = {
	COMMAND_PING: /^!ping$/,
	COMMAND_PAUSE: /^!pause$/,
	COMMAND_RESUME: /^!resume$/,
	COMMAND_STOP: /^!stop$/,
	COMMAND_PLAY_YOUTUBE: /^(!play )(https?\:\/\/)?((www\.)?youtube\.com|youtu\.?be)\/.+$/,
	VALID_NUMBER: /(?<=\s|^)-?\d+(,\d+)*/,
	WATO_HELP: /^!wato$/
};

export const MESSAGE_TARGETS = {
	WATO_CHALLENGE: 'what are the odds',
	WATO_DECLINE: 'decline'
};
