package bot

import "github.com/bwmarrin/discordgo"

const pingRegex = "^!ping$"

func ping(s *discordgo.Session, m *discordgo.MessageCreate) {
	s.ChannelMessageSend(m.ChannelID, "Pong! :ping_pong:")
}
