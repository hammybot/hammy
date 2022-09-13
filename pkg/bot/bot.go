package bot

import (
	"fmt"
	"os"
	"os/signal"
	"regexp"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

type MessageCreateHandler func(s *discordgo.Session, m *discordgo.MessageCreate)

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
	// Ping Pong & version!
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
			handler(s, m)
		}
	}, nil
}
