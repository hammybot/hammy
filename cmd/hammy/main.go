package main

import (
	"fmt"
	"log/slog"
	"os"
	"runtime"

	"github.com/austinvalle/hammy/internal/bot"
	"github.com/bwmarrin/discordgo"
	"github.com/spf13/viper"
)

const botTokenEnv = "DISCORD_BOT_TOKEN"

func init() {
	viper.SetDefault("LogLevel", discordgo.LogWarning)

	//todo: this will require env file and we should fix that so it isnt always the case
	viper.SetConfigFile(".env")
}
func main() {
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("Fatal error config file: %s \n", err))
	}

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
	if !viper.IsSet(botTokenEnv) {
		return nil, fmt.Errorf("%s environment variable not found", botTokenEnv)
	}

	session, err := discordgo.New(fmt.Sprintf("Bot %s", viper.GetString(botTokenEnv)))
	if err != nil {
		return nil, err
	}

	ll := viper.GetInt("LogLevel")

	//todo: use flags with viper
	session.LogLevel = ll
	session.Identify.Intents = discordgo.IntentGuildMessages

	return session, nil
}
