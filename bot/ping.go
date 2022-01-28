package bot

func pingMessage(bc BotContext, dc DiscordContext) {
	// Ignore all messages created by the bot itself
	// This isn't required in this specific example but it's a good practice.
	if dc.message.Author.ID == dc.session.State.User.ID {
		return
	}
	// If the message is "ping" reply with "Pong!"
	if dc.message.Content == "!ping" {
		dc.session.ChannelMessageSend(dc.message.ChannelID, "Pong!")
	}
}
