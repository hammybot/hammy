package bot

import (
	"fmt"
	"log/slog"
	"os"
	"os/signal"

	"github.com/austinvalle/hammy/internal/command"
	"github.com/bwmarrin/discordgo"
)

func RunBot(l *slog.Logger, session *discordgo.Session) error {
	err := session.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %w", err)
	}

	logger := createBotLogger(l, session)
	logger.Info("bot successfully connected...")

	registerBotCommands(logger, session)

	defer session.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	logger.Info("bot shutting down...")

	return nil
}

func registerBotCommands(l *slog.Logger, s *discordgo.Session) {
	ping := newPingCommand()
	wato := newWatoCommand(l)
	command.RegisterGuildCommand(l, s, ping)
	command.RegisterInteractionCreate(l, s, ping)

	textCommands := []command.TextCommand{
		wato,
	}
	command.RegisterTextCommands(l, s, textCommands)
}

func createBotLogger(logger *slog.Logger, session *discordgo.Session) *slog.Logger {
	if session.State != nil && session.State.Ready.User != nil {
		logger = logger.With("bot_username", session.State.Ready.User.Username)
	}

	return logger
}
