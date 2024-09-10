package bot

import (
	"fmt"
	"github.com/austinvalle/hammy/internal/command"
	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
	"log/slog"
	"os"
	"os/signal"
)

func RunBot(l *slog.Logger, session *discordgo.Session, llmUrl string) error {
	//create llm first, this is initializing the models so it can take some time to come online
	model, llmErr := llm.NewLLM(l, llmUrl)
	if llmErr != nil {
		return fmt.Errorf("unable to create llm: %w", llmErr)
	}

	err := session.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %w", err)
	}

	logger := createBotLogger(l, session)
	logger.Info("bot successfully connected")

	registerBotCommands(logger, session, model)
	_ = session.UpdateStatusComplex(discordgo.UpdateStatusData{
		AFK: false,
	})

	defer session.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	logger.Info("bot shutting down")

	return nil
}

func registerBotCommands(l *slog.Logger, s *discordgo.Session, model *llm.LLM) {
	ping := newPingCommand()

	command.RegisterGuildCommand(l, s, ping)
	command.RegisterInteractionCreate(l, s, ping)

	adminCommands := newAdminCommand(l, model)
	analyze := newSummarizeCommand(l, model)
	chat := newChatCommand(l, model)

	//order matters they are checked in order
	textCommands := []command.TextCommand{
		adminCommands,
		analyze,
		chat,
	}
	command.RegisterTextCommands(l, s, textCommands)
}

func createBotLogger(logger *slog.Logger, session *discordgo.Session) *slog.Logger {
	if session.State != nil && session.State.Ready.User != nil {
		logger = logger.With("bot_username", session.State.Ready.User.Username)
	}

	return logger
}
