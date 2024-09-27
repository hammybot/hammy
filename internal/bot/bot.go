package bot

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"

	"github.com/austinvalle/hammy/internal/bot/wato"
	"github.com/austinvalle/hammy/internal/command"
	"github.com/austinvalle/hammy/internal/config"
	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RunBot(l *slog.Logger, session *discordgo.Session, cfg config.Config) error {
	ctx := context.Background()

	l.Info("opening session and starting bot")
	err := session.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %w", err)
	}

	logger := createBotLogger(l, session)
	logger.Info("bot successfully connected")

	logger.Info("connecting to database", "host", cfg.DBHost, "port", cfg.DBPort)

	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort)
	dbpool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return fmt.Errorf("error creating database: %w", err)
	}

	defer dbpool.Close()

	err = registerBotCommands(logger, session, cfg, dbpool)
	_ = session.UpdateStatusComplex(discordgo.UpdateStatusData{
		AFK: false,
	})

	if err != nil {
		return fmt.Errorf("unable to register bot commands: %w", err)
	}

	defer session.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	logger.Info("bot shutting down")

	return nil
}

func registerBotCommands(l *slog.Logger, s *discordgo.Session, cfg config.Config, dbPool *pgxpool.Pool) error {
	ping := newPingCommand()

	command.RegisterGuildCommand(l, s, ping)
	command.RegisterInteractionCreate(l, s, ping)

	textCommands := make([]command.TextCommand, 0)

	// LLM commands
	if !cfg.DisableLLM {
		//create llm first, this is initializing the models so it can take some time to come online
		model, llmErr := llm.NewLLM(l, cfg.LlmUrl)
		if llmErr != nil {
			return fmt.Errorf("unable to create llm: %w", llmErr)
		}

		adminCommands := newAdminCommand(l, model)
		analyze := newSummarizeCommand(l, model)
		chat := newChatCommand(l, model)

		//order matters they are checked in order
		textCommands = append(textCommands, []command.TextCommand{
			adminCommands,
			analyze,
			chat,
		}...)
	}

	// WATO commands
	textCommands = append(textCommands, []command.TextCommand{
		wato.NewWatoChallengeCommand(l, dbPool),
	}...)

	command.RegisterTextCommands(l, s, textCommands)

	return nil
}

func createBotLogger(logger *slog.Logger, session *discordgo.Session) *slog.Logger {
	if session.State != nil && session.State.Ready.User != nil {
		logger = logger.With("bot_username", session.State.Ready.User.Username)
	}

	return logger
}
