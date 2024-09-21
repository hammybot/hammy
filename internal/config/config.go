package config

import (
	"fmt"
	"log/slog"

	"github.com/bwmarrin/discordgo"
	"github.com/spf13/viper"
)

type Config struct {
	LlmUrl          string `mapstructure:"LLM_URL"`
	ResponseEmoji   string `mapstructure:"RESPONSE_EMOJI"`
	LogLevel        int    `mapstructure:"LOG_LEVEL"`
	DiscordLogLevel int    `mapstructure:"DISCORD_LOG_LEVEL"`
	BotToken        string `mapstructure:"DISCORD_BOT_TOKEN"`

	DBHost     string `mapstructure:"POSTGRES_HOST"`
	DBPort     string `mapstructure:"POSTGRES_PORT"`
	DBName     string `mapstructure:"POSTGRES_DB"`
	DBUser     string `mapstructure:"POSTGRES_USER"`
	DBPassword string `mapstructure:"POSTGRES_PASSWORD"`

	DisableLLM bool `mapstructure:"DISABLE_LLM"`
}

func CreateConfig() Config {
	viper.SetDefault("ResponseEmoji", "\U0001F914")
	viper.SetDefault("DISCORD_LOG_LEVEL", discordgo.LogWarning)
	viper.SetDefault("LOG_LEVEL", slog.LevelDebug)
	viper.SetDefault("LLM_URL", "http://localhost:11434")
	_ = viper.BindEnv("DISCORD_BOT_TOKEN")
	_ = viper.BindEnv("POSTGRES_HOST")
	_ = viper.BindEnv("POSTGRES_PORT")
	_ = viper.BindEnv("POSTGRES_DB")
	_ = viper.BindEnv("POSTGRES_USER")
	_ = viper.BindEnv("POSTGRES_PASSWORD")
	_ = viper.BindEnv("DISABLE_LLM")
	viper.AutomaticEnv()

	var cfg Config

	err := viper.Unmarshal(&cfg)
	if err != nil {
		panic(fmt.Sprintf("unable to decode config, %s", err.Error()))
	}

	return cfg
}
