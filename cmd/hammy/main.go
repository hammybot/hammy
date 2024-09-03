package main

import (
	"fmt"
	"github.com/spf13/viper"
	"log"
	"log/slog"
	"os"
	"runtime"

	"github.com/austinvalle/hammy/internal/bot"
	"github.com/bwmarrin/discordgo"
)

type Config struct {
	LlmUrl          string `mapstructure:"LLM_URL"`
	ResponseEmoji   string `mapstructure:"RESPONSE_EMOJI"`
	LogLevel        int    `mapstructure:"LOG_LEVEL"`
	DiscordLogLevel int    `mapstructure:"DISCORD_LOG_LEVEL"`
	BotToken        string `mapstructure:"DISCORD_BOT_TOKEN"`
}

func init() {
	viper.SetDefault("ResponseEmoji", "\U0001F914")
	viper.SetDefault("DISCORD_LOG_LEVEL", discordgo.LogWarning)
	viper.SetDefault("LOG_LEVEL", slog.LevelDebug)
	viper.SetDefault("LLM_URL", "http://localhost:11434")
	_ = viper.BindEnv("DISCORD_BOT_TOKEN")
	viper.AutomaticEnv()
}

func main() {
	var config Config

	err := viper.Unmarshal(&config)
	if err != nil {
		log.Fatalf("unable to decode config, %v", err)
	}

	rootLogger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.Level(config.LogLevel),
	}))

	botSession, err := createDiscordSession(config)
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

	if err := bot.RunBot(rootLogger, botSession, config.LlmUrl); err != nil {
		rootLogger.Error("fatal error starting bot", "err", err)
		os.Exit(1)
	}
}

func createDiscordSession(config Config) (*discordgo.Session, error) {

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
