const Stopwatch = require('timer-stopwatch');
const CONSTANTS = require('../utils/constants');

const sendPing = msg => {
	const timer = new Stopwatch();
	timer.start();
	msg.channel.send(CONSTANTS.BOT_MESSAGES.PONG).then(pongMsg => {
		timer.stop();

		pongMsg.edit(`${pongMsg.content} ${"`"}${timer.ms}ms${"`"}`);
	});
}

module.exports = {
	sendPing: sendPing
}
