const CONSTANTS = require('../utils/constants');

const sendPing = msg => {
    msg.channel.send(CONSTANTS.BOT_MESSAGES.PONG);
}

module.exports = {
    sendPing: sendPing
}