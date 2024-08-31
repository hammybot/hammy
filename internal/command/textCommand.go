package command

import (
	"context"
	"fmt"
	"github.com/bwmarrin/discordgo"
	"log/slog"
)

type DiscordChannelRetriever interface {
	Channel(string, ...discordgo.RequestOption) (*discordgo.Channel, error)
}

type TextCommand interface {
	Name() string
	Handler(context.Context, *discordgo.Session, *discordgo.MessageCreate) (*discordgo.MessageSend, error)
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
				reply, err := c.Handler(context.Background(), s, m)
				if err != nil {
					l.Error(fmt.Sprintf("error handling message: %v", m.Content))
					if _, sendErr := s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Sorry %s, I am having an issue completing your request.", m.Author.Mention())); sendErr != nil {
						l.Error(fmt.Sprintf("error sending message: %v", err))
					}
				}
				if _, sendErr := s.ChannelMessageSendComplex(m.ChannelID, reply); sendErr != nil {
					l.Error(fmt.Sprintf("error sending message: %v", sendErr))
				}
			}
		}
	})
}
