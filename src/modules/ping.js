const sendPing = msg => {
    msg.channel.send(':ping_pong: Pong!');
}

module.exports = {
    sendPing: sendPing
}