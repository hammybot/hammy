package wato

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"

	"github.com/bwmarrin/discordgo"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var watoHelpRegex = regexp.MustCompile(`^!wato$`)

// helpCommand does exactly what it sounds like, provides contextual help for users. Playing WATO in discord, it
// can be easy to lose the context of who challenged you, what the bet was, what commands to use,
// where to respond, etc.
//
// Help can be solicited via DM or text channels.
type helpCommand struct {
	logger *slog.Logger
	dbPool *pgxpool.Pool
}

func NewWatoHelpCommand(logger *slog.Logger, dbPool *pgxpool.Pool) *helpCommand {
	return &helpCommand{
		logger: logger,
		dbPool: dbPool,
	}
}

func (c *helpCommand) Name() string {
	return "wato-help"
}

func (c *helpCommand) CanActivate(s *discordgo.Session, m discordgo.Message) bool {
	return watoHelpRegex.Match([]byte(m.Content))
}

func (c *helpCommand) Handler(_ context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	activeChallenge, err := getActiveChallenge(c.dbPool, m.Author.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			helpEmbed := genericHelpEmbed(m.Author.Username, s.State.User.Username)
			_, err = s.ChannelMessageSendEmbed(m.ChannelID, helpEmbed)
			return nil, err
		}

		return nil, err
	}

	isAuthorChallenger := activeChallenge.ChallengerID == m.Author.ID
	opponentID := activeChallenge.ChallengerID
	if isAuthorChallenger {
		opponentID = activeChallenge.ChallengedID
	}

	opponent, err := s.User(opponentID)
	if err != nil {
		return nil, err
	}

	var helpEmbed *discordgo.MessageEmbed
	switch activeChallenge.Status {
	case pendingAccept:
		if isAuthorChallenger {
			helpEmbed = waitingOnOpponentAcceptHelpEmbed(*m.Author, *opponent)
			break
		}
		helpEmbed = waitingOnAuthorAcceptHelpEmbed(*opponent)
	case pendingBets:
		if (isAuthorChallenger && activeChallenge.ChallengerBet == nil) ||
			(!isAuthorChallenger && activeChallenge.ChallengedBet == nil) {
			helpEmbed = waitingOnAuthorBetHelpEmbed()
			break
		}
		helpEmbed = waitingOnOpponentBetHelpEmbed(*opponent)
	default:
		helpEmbed = genericHelpEmbed(m.Author.Username, s.State.User.Username)
	}

	_, err = s.ChannelMessageSendEmbed(m.ChannelID, helpEmbed)
	return nil, err
}

func genericHelpEmbed(authorUsername, botUsername string) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Type:  discordgo.EmbedTypeRich,
		Title: "How to Play WATO (What are the Odds?)",
		Color: 0x1ed8f7,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "**1. Challenge someone by mentioning them like below:**",
				Value: fmt.Sprintf("`@%s what are the odds that you challenge me?`", botUsername),
			},
			{
				Name:  "**2a. The challenged player will respond mentioning you and with an odd:**",
				Value: fmt.Sprintf("`@%s 10,000`", authorUsername),
			},
			{
				Name:  "**2b. The challenged player can also decline the challenge like below:**",
				Value: fmt.Sprintf("`@%s decline`", authorUsername),
			},
			{
				Name:  "**3. If an odd was given, I'll DM both of you asking for a bet! Just respond with a number.**",
				Value: "`100`",
			},
			{
				Name:  "**4. Once both players have bet, I'll respond in the original channel with the winner!**",
				Value: "If the challenged player guesses the same number as you, you win!",
			},
		},
	}
}

func waitingOnAuthorAcceptHelpEmbed(opponent discordgo.User) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Type:  discordgo.EmbedTypeRich,
		Title: "WATO Help - You're in an active challenge!",
		Color: 0x1ed8f7,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  fmt.Sprintf("**You need to respond to the challenge from %s**", opponent.Username),
				Value: fmt.Sprintf("`@%s 1326`", opponent.Username),
			},
		},
	}
}
func waitingOnOpponentAcceptHelpEmbed(author, opponent discordgo.User) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Type:  discordgo.EmbedTypeRich,
		Title: "WATO Help - You're in an active challenge!",
		Color: 0x1ed8f7,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  fmt.Sprintf("**You're waiting for %s to accept or decline!**", opponent.Username),
				Value: fmt.Sprintf("`@%s 1326`", author.Username),
			},
		},
	}
}

func waitingOnAuthorBetHelpEmbed() *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Type:  discordgo.EmbedTypeRich,
		Title: "WATO Help - You're in an active challenge!",
		Color: 0x1ed8f7,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "**You need to respond with a bet to my DM! Just respond with a number.**",
				Value: "`100`",
			},
		},
	}
}
func waitingOnOpponentBetHelpEmbed(opponent discordgo.User) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Type:  discordgo.EmbedTypeRich,
		Title: "WATO Help - You're in an active challenge!",
		Color: 0x1ed8f7,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  fmt.Sprintf("**You're waiting for %s's bet**", opponent.Username),
				Value: "They need to answer my DM",
			},
		},
	}
}
