package bot

import (
	"github.com/bwmarrin/discordgo"
)

type DiscordContext struct {
	session *discordgo.Session
	message *discordgo.MessageCreate
}
