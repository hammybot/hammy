package main

import (
	"fmt"
	"log/slog"
	"os"
	"runtime"
	"strconv"

	"github.com/austinvalle/hammy/internal/bot"
	"github.com/bwmarrin/discordgo"
)

const (
	botTokenEnv          = "DISCORD_BOT_TOKEN"
	hammyLogLevelEnv     = "HAMMY_LOG_LEVEL"
	discordgoLogLevelEnv = "DISCORDGO_LOG_LEVEL"
)

func main() {
	rootLogger := rootLogger()
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

	discordgoLogLevel := discordgo.LogWarning
	if levelInt, err := strconv.Atoi(os.Getenv(discordgoLogLevelEnv)); err == nil {
		discordgoLogLevel = levelInt
	}

	session.LogLevel = discordgoLogLevel
	session.Identify.Intents = discordgo.IntentGuildMessages

	return session, nil
}

func rootLogger() *slog.Logger {
	hammyLogLevel := slog.LevelInfo
	if levelInt, err := strconv.Atoi(os.Getenv(hammyLogLevelEnv)); err == nil {
		hammyLogLevel = slog.Level(levelInt)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: hammyLogLevel,
	}))

	return logger
}
