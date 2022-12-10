package bot

const pingRegex = `^!ping$`

func ping(ctx messageContext) error {
	_, err := ctx.session.ChannelMessageSend(ctx.msg.ChannelID, "Pong! :ping_pong:")

	return err
}
