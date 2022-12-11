package bot

import (
	"errors"
	"fmt"
	"os"
	"os/signal"
	"reflect"
	"runtime"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type botContext struct {
	session *discordgo.Session
	logger  zerolog.Logger
}

type InteractionHandler func(botContext, *discordgo.InteractionCreate) error

func RunBot(session *discordgo.Session) error {
	err := session.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %w", err)
	}
	log.Print("hammy is up and running...")

	registerBotCommands(session)

	defer session.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Print("hammy is shutting down...")

	return nil
}

func registerBotCommands(s *discordgo.Session) {
	safeRegister(s, ping, pingName, pingDescription)
	go listGlobalCommands(s)
}

func safeRegister(s *discordgo.Session, handler InteractionHandler, interactionName string, interactionDesc string) {
	_, err := s.ApplicationCommandCreate(s.State.User.ID, "", &discordgo.ApplicationCommand{
		Name:        interactionName,
		Description: interactionDesc,
	})
	if err != nil {
		log.Warn().
			Err(fmt.Errorf("unable to register command: '%s' - %w", interactionName, err)).
			Msg("")
	}

	s.AddHandler(createInteractionHandler(handler, interactionName))
}

func createInteractionHandler(handler InteractionHandler, slashName string) func(s *discordgo.Session, event *discordgo.InteractionCreate) {
	return func(s *discordgo.Session, event *discordgo.InteractionCreate) {
		if slashName == event.ApplicationCommandData().Name {
			logger := createLogger(handler, event)
			logger.Debug().Msg("invoking handler")

			err := handler(botContext{session: s, logger: logger}, event)
			if err != nil {
				logger.Error().Err(err).Msg("")
			}
		}
	}
}

func createLogger(handler any, event *discordgo.InteractionCreate) zerolog.Logger {
	functionName := runtime.FuncForPC(reflect.ValueOf(handler).Pointer()).Name()

	user := getUserFromInteraction(event)
	return log.With().
		Str("user.id", user.ID).
		Str("user.username", user.Username).
		Str("channelID", event.ChannelID).
		Str("handler", functionName).
		Logger()
}

func getUserFromInteraction(event *discordgo.InteractionCreate) *discordgo.User {
	if event.Member != nil {
		return event.Member.User
	} else if event.User != nil {
		return event.User
	} else {
		log.Warn().Err(errors.New("couldn't extract user info from interaction")).Msg("")
		return &discordgo.User{
			ID:       "unknown",
			Username: "unknown",
		}
	}
}

func listGlobalCommands(s *discordgo.Session) {
	cmds, err := s.ApplicationCommands(s.State.User.ID, "")
	if err != nil {
		log.Warn().
			Err(fmt.Errorf("couldn't list global commands - %w", err)).
			Msg("")
		return
	}

	for _, cmd := range cmds {
		log.Info().Str("command.name", cmd.Name).Msg("globally registered")
	}
}
