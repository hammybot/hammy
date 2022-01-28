package config

import "github.com/austinvalle/hammy/logging"

type AppConfig struct {
	DiscordBotToken string           `mapstructure:"DISCORD_BOT_TOKEN"`
	LogLevel        logging.LogLevel `mapstructure:"log_level"`
}
