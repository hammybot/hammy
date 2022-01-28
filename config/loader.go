package config

import (
	"fmt"

	"github.com/spf13/viper"

	// Automatically loads .env file
	_ "github.com/joho/godotenv/autoload"
)

func LoadConfig(configPath string) (AppConfig, error) {
	var appConfig AppConfig
	viper.SetConfigName("config")
	viper.AddConfigPath(configPath)
	viper.BindEnv("DISCORD_BOT_TOKEN")

	if readErr := viper.ReadInConfig(); readErr != nil {
		return AppConfig{}, fmt.Errorf("unable to read config: %v", readErr)
	}

	if unmarshalErr := viper.Unmarshal(&appConfig); unmarshalErr != nil {
		return AppConfig{}, fmt.Errorf("unable to unmarshal config: %v", unmarshalErr)
	}

	validateErr := validateConfig(appConfig)
	return appConfig, validateErr
}

func validateConfig(config AppConfig) error {
	if config.DiscordBotToken == "" {
		return fmt.Errorf("unable to validate config: environment variable 'DISCORD_BOT_TOKEN' is missing")
	}

	return nil
}
