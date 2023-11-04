package main

import (
	"fmt"
	"log/slog"
	"os"
	"runtime"

	"github.com/austinvalle/hammy/internal/bot"
	"github.com/bwmarrin/discordgo"
)

const botTokenEnv = "DISCORD_BOT_TOKEN"

func main() {
	// TODO: should probably accept log level via input (env variable or flag)
	rootLogger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	botSession, err := createDiscordSession()
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

	if err := bot.RunBot(rootLogger, botSession); err != nil {
		rootLogger.Error("fatal error starting bot", "err", err)
		os.Exit(1)
	}
}

func createDiscordSession() (*discordgo.Session, error) {
	botToken, ok := os.LookupEnv(botTokenEnv)
	if !ok {
		return nil, fmt.Errorf("%s environment variable not found", botTokenEnv)
	}

	session, err := discordgo.New(fmt.Sprintf("Bot %s", botToken))
	if err != nil {
		return nil, err
	}

	// TODO: should probably accept log level via input (env variable or flag)
	session.LogLevel = discordgo.LogWarning

	return session, nil
}
