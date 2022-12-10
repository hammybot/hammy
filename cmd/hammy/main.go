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
	botSession, err := createDiscordSession()
	if err != nil {
		log.Fatal().Err(fmt.Errorf("failed creating discord client: %w", err)).Msg("")
	}

	if err := bot.RunBot(botSession); err != nil {
		log.Fatal().Err(fmt.Errorf("failed running bot: %w", err)).Msg("")
	}
}

func createDiscordSession() (*discordgo.Session, error) {
	botToken := os.Getenv(botTokenEnv)
	if botToken == "" {
		return nil, fmt.Errorf("'%s' environment variable not found", botTokenEnv)
	}

	session, err := discordgo.New(fmt.Sprintf("Bot %v", botToken))
	if err != nil {
		return nil, err
	}

	session.LogLevel = discordgo.LogWarning
	return session, nil
}
