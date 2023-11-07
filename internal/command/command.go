package command

import (
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

// Command represents a Discord Application Command
// https://discord.com/developers/docs/interactions/application-commands
type Command interface {
	// Name of application command to display in UI
	Name() string

	// Description of application command to display in UI
	Description() string
}

type MessageHandler func(l *slog.Logger, s *discordgo.Session, m *discordgo.MessageCreate) error

// RegisterGuildCommand creates a guild level application command when a guild create event is dispatched.
// The underlying API call is an upsert and safe to call multiple times.
func RegisterGuildCommand(l *slog.Logger, s *discordgo.Session, c Command) {
	s.AddHandler(func(s *discordgo.Session, event *discordgo.GuildCreate) {
		err := createGuildCommand(s, c, event.Guild)
		if err != nil {
			l.Warn("unable to register command", "err", err, "command.name", c.Name())
		}
	})
}

func createGuildCommand(s *discordgo.Session, c Command, guild *discordgo.Guild) error {
	_, err := s.ApplicationCommandCreate(s.State.User.ID, guild.ID, &discordgo.ApplicationCommand{
		Name:        c.Name(),
		Description: c.Description(),
	})

	return err
}
