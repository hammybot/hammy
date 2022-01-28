package main

import (
	"os"

	"github.com/austinvalle/hammy/bot"
	"github.com/austinvalle/hammy/config"
	"github.com/austinvalle/hammy/logging"
)

func main() {
	os.Exit(realMain())
}

func realMain() int {
	appConfig, configErr := config.LoadConfig(".")
	logger := logging.CreateAppLogger(appConfig.LogLevel)
	if configErr != nil {
		logger.Errorf("%v", configErr)
		return 1
	}

	startErr := bot.StartBot(appConfig, logger)
	if startErr != nil {
		logger.Errorf("%v", startErr)
		return 1
	}

	return 0
}
