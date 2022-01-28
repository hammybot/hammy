package bot

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/austinvalle/hammy/config"
	"github.com/austinvalle/hammy/logging"
	"github.com/bwmarrin/discordgo"
)

func StartBot(config config.AppConfig, logger logging.Logger) error {
	botAuth := fmt.Sprintf("Bot %v", config.DiscordBotToken)
	bot_session, initErr := discordgo.New(botAuth)
	if initErr != nil {
		return fmt.Errorf("unable to create bot session: %v", initErr)
	}

	runErr := bot_session.Open()
	if runErr != nil {
		return fmt.Errorf("unable to connect bot to discord: %v", runErr)
	}
	logger.Infof("hammy is up and running...")
	bot_session.AddHandler(createContext(config, logger, pingMessage))

	defer bot_session.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	logger.Infof("bot gracefully shutting down")

	return nil
}

func createContext(config config.AppConfig, logger logging.Logger, wrappedFunc func(BotContext, DiscordContext)) func(s *discordgo.Session, m *discordgo.MessageCreate) {
	return func(s *discordgo.Session, m *discordgo.MessageCreate) {
		botContext := BotContext{
			botConfig: config,
			logger:    logger,
		}
		discordContext := DiscordContext{
			session: s,
			message: m,
		}
		wrappedFunc(botContext, discordContext)
	}
}
