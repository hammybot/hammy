package bot

import (
	"context"
	"github.com/bwmarrin/discordgo"
	"strings"
)

type helpCommand struct {
}

func newHelpCommand() *helpCommand {
	return &helpCommand{}
}

func (c *helpCommand) Name() string { return "help" }

func (c *helpCommand) CanActivate(_ *discordgo.Session, m discordgo.Message) bool {
	return strings.HasPrefix(m.Content, "!help")
}
func (c *helpCommand) Handler(_ context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	helpMessage := &discordgo.MessageEmbed{
		Type:        discordgo.EmbedTypeRich,
		Title:       "How can I help?",
		Description: "Here is what I can do",
		Color:       0x00ff00,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "URL Analyzer",
				Value: "Type `analyze {url}` or just ask me about a question like `{your question} {url}` and I'll give you insights about the link.",
			},
			{
				Name:  "Create Art",
				Value: "Use `!art {your idea}` to generate unique artwork!",
			},
			{
				Name:  "Enable / disable image prompt enhancement",
				Value: "Use `setImageEnhancement {on or off}` to change Hammy's ability to enhance your art prompt!",
			},
			{
				Name:  "WATO (What Are The Odds)",
				Value: "Challenge someone with `what are the odds {challenge}` for a fun game!",
			},
			{
				Name:  "Reset Context",
				Value: "type `resetContext` to help me get back on track if I lost my way! This will clear my memory of previous commands / conversation",
			},
		},
	}

	_, err := s.ChannelMessageSendEmbed(m.ChannelID, helpMessage)

	return nil, err
}
