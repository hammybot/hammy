package command

import (
	"fmt"
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

type DiscordChannelRetriever interface {
	Channel(string, ...discordgo.RequestOption) (*discordgo.Channel, error)
}

type TextCommand interface {
	Command

	Handler(*discordgo.Session, *discordgo.MessageCreate) error
	CanActivate(DiscordChannelRetriever, discordgo.Message) bool
}

// RegisterTextCommand adds a new handler for messageCreate events.
// It will ensure the message is not from the bot and verify the pattern matches before executing the handler
func RegisterTextCommands(l *slog.Logger, s *discordgo.Session, tc []TextCommand) {
	s.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		l.Debug(fmt.Sprintf("message contents: %v", m.Content))
		//filter bot messages out for safety
		if m.Author.ID == s.State.User.ID || m.Author.Bot {
			return
		}
		for _, c := range tc {
			if c.CanActivate(s, *m.Message) {
				l.Debug("found message for text command", slog.String("name", c.Name()))
				err := c.Handler(s, m)
				if err != nil {
					l.Error(fmt.Sprintf("error handling message: %v", m.Content))
				}
			}
		}
	})
}
