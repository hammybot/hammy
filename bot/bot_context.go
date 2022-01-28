package bot

import (
	"github.com/austinvalle/hammy/config"
	"github.com/austinvalle/hammy/logging"
)

type BotContext struct {
	logger    logging.Logger
	botConfig config.AppConfig
}
