package bot

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

func RunBot(botSession *discordgo.Session) error {
	err := botSession.Open()
	if err != nil {
		return fmt.Errorf("unable to connect bot to discord: %v", err)
	}
	log.Print("hammy is up and running...")

	botSession.AddHandler(ping)

	defer botSession.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Print("hammy is shutting down...")

	return nil
}
