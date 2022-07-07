package main

import (
	"fmt"
	"os"

	"github.com/austinvalle/hammy/pkg/bot"
	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

const botTokenEnv = "DISCORD_BOT_TOKEN"

func main() {
	err := realMain()
	if err != nil {
		log.Error().Err(err).Msg("")
		os.Exit(1)
	}
}

func realMain() error {
	botSession, err := createDiscordSession()
	if err != nil {
		return fmt.Errorf("failed creating discord client: %v", err)
	}

	err = bot.RunBot(botSession)
	if err != nil {
		return fmt.Errorf("failed running bot: %v", err)
	}

	return nil
}

func createDiscordSession() (*discordgo.Session, error) {
	botToken := os.Getenv(botTokenEnv)
	if botToken == "" {
		return nil, fmt.Errorf("'%s' environment variable not found", botTokenEnv)
	}

	return discordgo.New(fmt.Sprintf("Bot %v", botToken))
}
