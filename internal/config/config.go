package config

import (
	"github.com/bwmarrin/discordgo"
	"github.com/spf13/viper"
	"log"
	"log/slog"
	"time"
)

type Config struct {
	LlmUrl          string        `mapstructure:"LLM_URL"`
	ResponseEmoji   string        `mapstructure:"RESPONSE_EMOJI"`
	LogLevel        int           `mapstructure:"LOG_LEVEL"`
	DiscordLogLevel int           `mapstructure:"DISCORD_LOG_LEVEL"`
	BotToken        string        `mapstructure:"DISCORD_BOT_TOKEN"`
	KeepAlive       time.Duration `mapstructure:"OLLAMA_KEEP_ALIVE"`
	DezgoToken      string        `mapstructure:"DEZGO_TOKEN"`
}

func NewConfig() Config {
	var cfg Config

	viper.SetDefault("ResponseEmoji", "\U0001F914")
	viper.SetDefault("DISCORD_LOG_LEVEL", discordgo.LogWarning)
	viper.SetDefault("LOG_LEVEL", slog.LevelDebug)
	viper.SetDefault("LLM_URL", "http://localhost:11434")
	viper.SetDefault("OLLAMA_KEEP_ALIVE", 15*time.Minute)
	_ = viper.BindEnv("DISCORD_BOT_TOKEN")
	_ = viper.BindEnv("DEZGO_TOKEN")
	viper.AutomaticEnv()

	err := viper.Unmarshal(&cfg)
	if err != nil {
		log.Fatalf("unable to decode config, %v", err)
	}

	return cfg
}
