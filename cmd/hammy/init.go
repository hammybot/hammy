package main

import (
	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

// Override discordgo logger: https://github.com/bwmarrin/discordgo/issues/650#issuecomment-496605060
func init() {
	discordgo.Logger = func(msgL, caller int, format string, a ...interface{}) {
		switch msgL {
		case discordgo.LogError:
			log.Error().Msgf(format, a...)
		case discordgo.LogWarning:
			log.Warn().Msgf(format, a...)
		case discordgo.LogInformational:
			log.Info().Msgf(format, a...)
		case discordgo.LogDebug:
			log.Debug().Msgf(format, a...)
		}
	}
}
