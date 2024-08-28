package bot

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"strconv"

	"github.com/austinvalle/hammy/internal/command"
	"github.com/austinvalle/hammy/internal/models"
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

type WatoReader interface {
}

type WatoWriter interface {
	CreateNewChallenge(*models.WatoChallenge) error
	RetrieveChallenge(string) (*models.WatoChallenge, error)
	GetChallengeForUser(string) (*models.WatoChallenge, error)
	HasActiveChallenge([]string) bool
}

type WatoReaderWriter interface {
	WatoReader
	WatoWriter
}

type CommandHandler = func(s *discordgo.Session, m *discordgo.MessageCreate) error
type watoCommand struct {
	logger *slog.Logger
	db     WatoReaderWriter
}

func newWatoCommand(l *slog.Logger, db WatoReaderWriter) *watoCommand {
	return &watoCommand{
		logger: l,
		db:     db,
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
	mentioned := m.Mentions[0]
	author := m.Author

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

		if h.db.HasActiveChallenge([]string{author.ID, mentioned.ID}) {
			h.logger.Info("active challenge already active for user")
			//todo: change this so we can figure out who is already in the challenge for the response
		}

		d, err := removeMention(m.Content)

		if err != nil {
			h.logger.Error("could not create new challenge")
			return err
		}

		c := &models.WatoChallenge{
			ChallengerId: author.ID,
			ChallengedId: mentioned.ID,
			Status:       PendingAccept,
			Description:  d,
		}
		if err := h.db.CreateNewChallenge(c); err != nil {
			return err
		}

		msg := fmt.Sprintf("%s has challenged %s to a game of odds!", author.Username, mentioned.Username)

		s.ChannelMessageSend(m.ChannelID, msg, discordgo.WithContext(context.TODO()))
		//post in channel
		//message each user for their answer
		//add to db
		//show result in channel

	}

	return nil
}

func removeMention(description string) (string, error) {
	r, err := regexp.Compile(`@[\w\d_]*[,]{0,1} {0,1}`)
	if err != nil {
		return "", fmt.Errorf("error compiling regex for mention")
	}
	return r.ReplaceAllString(description, ""), nil
}

// todo: this isnt really saving much
func getChannelType(s command.DiscordChannelRetriever, id string) (discordgo.ChannelType, error) {
	c, err := s.Channel(id)
	if err != nil {
		return 0, err
	}
	return c.Type, nil
}
