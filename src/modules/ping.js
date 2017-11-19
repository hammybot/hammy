const sendPing = message => {
    message.channel.send(':ping_pong: Pong!');
}

module.exports = {
    sendPing: sendPing
}