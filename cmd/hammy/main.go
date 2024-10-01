package main

import (
	"fmt"
	"github.com/austinvalle/hammy/internal/bot"
	"github.com/austinvalle/hammy/internal/config"
	"github.com/bwmarrin/discordgo"
	"log/slog"
	"os"
	"runtime"
)

func main() {
	cfg := config.NewConfig()

	rootLogger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.Level(cfg.LogLevel),
	}))

	botSession, err := createDiscordSession(cfg)
	if err != nil {
		rootLogger.Error("fatal error creating discord client", "err", err)
		os.Exit(1)
	}

	info := getBinaryInfo()
	rootLogger.Info(
		"hammy started",
		"version", info.Version,
		"commit", info.Commit,
		"go_os", runtime.GOOS,
		"go_arch", runtime.GOARCH,
	)

	if rErr := bot.RunBot(rootLogger, botSession, cfg); rErr != nil {
		rootLogger.Error("fatal error starting bot", "err", rErr)
		os.Exit(1)
	}
}

func createDiscordSession(config config.Config) (*discordgo.Session, error) {

	if config.BotToken == "" {
		return nil, fmt.Errorf("DISCORD_BOT_TOKEN environment variable not found")
	}

	session, err := discordgo.New(fmt.Sprintf("Bot %s", config.BotToken))
	if err != nil {
		return nil, err
	}

	session.LogLevel = config.DiscordLogLevel

	return session, nil
}
