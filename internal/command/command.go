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

func CreateGlobalCommand(s *discordgo.Session, c Command) error {
	_, err := s.ApplicationCommandCreate(s.State.User.ID, "", &discordgo.ApplicationCommand{
		Name:        c.Name(),
		Description: c.Description(),
	})

	return err
}

func LogGlobalCommands(l *slog.Logger, s *discordgo.Session) {
	cmds, err := s.ApplicationCommands(s.State.User.ID, "")
	if err != nil {
		l.Warn("couldn't list global commands", "err", err)
		return
	}

	for _, cmd := range cmds {
		l.Info("command registered globally", "command.name", cmd.Name)
	}
}
