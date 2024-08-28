package bot

import (
	"fmt"
	"log/slog"
	"regexp"
	"strconv"

	"github.com/austinvalle/hammy/internal/command"
	"github.com/bwmarrin/discordgo"
)

const WATO_PATTERN = "^what are the odds .*"

const (
	PendingAccept = "PND"
	PendingBets   = "BET"
	Declined      = "DEC"
	Completed     = "CMP"
)

const Pattern = "^what are the odds .*"

type CommandHandler = func(s *discordgo.Session, m *discordgo.MessageCreate) error
type watoCommand struct {
	logger *slog.Logger
}
type watoChallenge struct {
	ChallengerId string
	ChallengedId string
	ChannelId    string
	Description  string
	Status       string
}

func newWatoCommand(l *slog.Logger) *watoCommand {
	return &watoCommand{
		logger: l,
	}
}

func (h *watoCommand) Name() string {
	return "WATO"
}

// Determines if the current message applies for the command
func (h *watoCommand) CanActivate(s command.DiscordChannelRetriever, m discordgo.Message) bool {
	channelType, err := getChannelType(s, m.ChannelID)

	if err != nil {
		h.logger.Error(fmt.Sprintf("error fetching channel type: %v", err), slog.String("channel_id", m.ChannelID))
	}

	if channelType == discordgo.ChannelTypeDM {
		_, err := strconv.ParseInt(m.Content, 0, 64)
		if err != nil {
			h.logger.Debug("dm message content not valid int")
		}
		return err == nil
	}

	if channelType == discordgo.ChannelTypeGuildPublicThread || channelType == discordgo.ChannelTypeGuildText {
		match, err := regexp.MatchString(Pattern, m.Content)
		if err != nil {
			h.logger.Error(fmt.Sprintf("error matching regex:%v", err))
		}
		return match
	}

	return false
}

func (h *watoCommand) Handler(s *discordgo.Session, m *discordgo.MessageCreate) error {
	h.logger.Debug("entered handler")

	//todo: logic for wato
	h.logger.Debug("received wato challenge", "content", m.Content)

	channelType, err := getChannelType(s, m.ChannelID)

	if err != nil {
		h.logger.Error("could not get channel type", "channel_id", m.ChannelID)
	}

	if channelType == discordgo.ChannelTypeDM {

		//get the guess from the user
		//find the right challenge and update
		//if challenge is ready, send answer
	} else {
		//check that neither user is already in a challenge
		//start new challenge
		challenge := &watoChallenge{
			ChallengerId: m.Author.ID,
			ChallengedId: m.Mentions[0].ID,
			Status:       PendingAccept,
			Description:  "todo",
		}
		fmt.Println(challenge)
	}

	// channel.Type
	// setup challenge obj
	//add to db
	//post in channel

	//message each user for their answer
	//add to db
	//show result in channel

	return nil
}

// func removeMention(description string) string {

// }

// todo: this isnt really saving much
func getChannelType(s command.DiscordChannelRetriever, id string) (discordgo.ChannelType, error) {
	c, err := s.Channel(id)
	if err != nil {
		return 0, err
	}
	return c.Type, nil
}
