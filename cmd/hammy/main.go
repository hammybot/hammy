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
		Level: slog.LevelWarn,
	}))

	// Capture discordgo logs: https://github.com/bwmarrin/discordgo/issues/650#issuecomment-496605060
	discordgo.Logger = func(msgL, caller int, format string, a ...interface{}) {
		switch msgL {
		case discordgo.LogError:
			rootLogger.Error(fmt.Sprintf(format, a...))
		case discordgo.LogWarning:
			rootLogger.Warn(fmt.Sprintf(format, a...))
		case discordgo.LogInformational:
			rootLogger.Info(fmt.Sprintf(format, a...))
		default:
			rootLogger.Debug(fmt.Sprintf(format, a...))
		}
	}

	botSession, err := createDiscordSession()
	if err != nil {
		rootLogger.Error("fatal error creating discord client", "err", err)
		os.Exit(1)
	}

	info := getBinaryInfo()
	logger := rootLogger.With(
		"version", info.Version,
		"commit_sha", info.Commit,
		"os_target", fmt.Sprintf("`%s/%s`", runtime.GOOS, runtime.GOARCH),
	)

	if err := bot.RunBot(logger, botSession); err != nil {
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
