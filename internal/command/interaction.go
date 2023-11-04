package command

import (
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

// InteractionCreate is the initial event when an interaction begins from discord
// https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction
type InteractionCreate interface {
	Command

	// Run is called each time an InteractionCreate event is dispatched that matches the command name
	Run(*slog.Logger, *discordgo.Session, *discordgo.InteractionCreate) error
}

// RegisterInteractionCreate registers the command to be called during an interaction create event
func RegisterInteractionCreate(l *slog.Logger, s *discordgo.Session, command InteractionCreate) {
	s.AddHandler(func(s *discordgo.Session, event *discordgo.InteractionCreate) {
		if command.Name() == event.ApplicationCommandData().Name {
			user := getUserFromInteraction(l, event)
			logger := l.With(
				"command.name", event.ApplicationCommandData().Name,
				"user.id", user.ID,
				"user.username", user.Username,
				"event.channelId", event.ChannelID,
			)

			logger.Debug("invoking command")
			err := command.Run(logger, s, event)
			if err != nil {
				logger.Error("error invoking command", "err", err)
			}
		}
	})
}

func getUserFromInteraction(l *slog.Logger, event *discordgo.InteractionCreate) *discordgo.User {
	if event.Member != nil {
		return event.Member.User
	} else if event.User != nil {
		return event.User
	} else {
		l.Warn("couldn't extract user info from interaction")
		return &discordgo.User{
			ID:       "unknown",
			Username: "unknown",
		}
	}
}
