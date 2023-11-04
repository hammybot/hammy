package bot

import (
	"log/slog"
	"reflect"
	"runtime"

	"github.com/bwmarrin/discordgo"
)

func createBotLogger(logger *slog.Logger, session *discordgo.Session) *slog.Logger {
	if session.State != nil && session.State.Ready.User != nil {
		logger = logger.With("bot_username", session.State.Ready.User.Username)
	}

	return logger
}

func createInteractionLogger(l *slog.Logger, handler any, event *discordgo.InteractionCreate) *slog.Logger {
	functionName := runtime.FuncForPC(reflect.ValueOf(handler).Pointer()).Name()

	user := getUserFromInteraction(l, event)
	return l.With(
		"command.name", event.ApplicationCommandData().Name,
		"user.id", user.ID,
		"user.username", user.Username,
		"event.channelId", event.ChannelID,
		"handler", functionName,
	)
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
