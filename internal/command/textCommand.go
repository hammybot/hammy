package command

import (
	"fmt"
	"log/slog"
	"regexp"

	"github.com/bwmarrin/discordgo"
)

// RegisterTextCommand adds a new handler for messageCreate events.
// It will ensure the message is not from the bot and verify the pattern matches before executing the handler
func RegisterTextCommand(l *slog.Logger, s *discordgo.Session, c TextCommand) {
	s.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		l.Debug(fmt.Sprintf("message contents: %v", m.Content))
		//filter bot messages out for safety
		if m.Author.ID == s.State.User.ID {
			return
		}
		match, err := regexp.MatchString(c.Pattern(), m.Content)

		if err != nil {
			l.Error("error matching command for text command: %v", err)
		}

		if match {
			l.Debug("found message for text command", slog.String("name", c.Name()))
			err = c.Handler(l, s, m)
			if err != nil {
				l.Error(fmt.Sprintf("error handling message: %v", m.Content))
			}
		} else {
			return
		}
	})
}
