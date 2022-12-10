package bot

import (
	"fmt"
	"os"
	"os/signal"
	"reflect"
	"regexp"
	"runtime"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type messageContext struct {
	session *discordgo.Session
	msg     *discordgo.Message
	logger  zerolog.Logger
}

type MessageCreateHandler func(messageContext) error

func RunBot(session *discordgo.Session) error {
	err := session.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %v", err)
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
	safeRegister(s, ping, pingRegex)
}

func safeRegister(s *discordgo.Session, handler MessageCreateHandler, match string) {
	h, err := readNewUserMessage(handler, match)
	if err != nil {
		log.Warn().Err(err).Msg("")
		return
	}

	s.AddHandler(h)
}

func readNewUserMessage(handler MessageCreateHandler, match string) (func(s *discordgo.Session, m *discordgo.MessageCreate), error) {
	regex, err := regexp.Compile(match)
	if err != nil {
		return nil, fmt.Errorf("skipped handler: %w", err)
	}

	return func(s *discordgo.Session, m *discordgo.MessageCreate) {
		// Ignore all messages created by the bot itself
		if m.Author.ID == s.State.User.ID {
			return
		}

		if regex.MatchString(m.Content) {
			logger := createLogger(handler, m)
			logger.Debug().Msg("invoking handler")

			err := handler(messageContext{
				session: s,
				msg:     m.Message,
				logger:  logger,
			})
			if err != nil {
				logger.Error().Err(err).Msg("")
			}
		}
	}, nil
}

func createLogger(handler any, m *discordgo.MessageCreate) zerolog.Logger {
	functionName := runtime.FuncForPC(reflect.ValueOf(handler).Pointer()).Name()
	return log.With().
		Str("author.id", m.Author.ID).
		Str("author.username", m.Author.Username).
		Str("channelID", m.ChannelID).
		Str("handler", functionName).
		Logger()
}
