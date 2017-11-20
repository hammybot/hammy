const MESSAGES = require('../utils/messages');

const sendPing = msg => {
    msg.channel.send(MESSAGES.PONG);
}

module.exports = {
    sendPing: sendPing
}