package wato

import (
	"context"
	"log/slog"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/jackc/pgx/v5/pgxpool"
)

type challengeCommand struct {
	logger *slog.Logger
	dbPool *pgxpool.Pool
}

func NewWatoChallengeCommand(logger *slog.Logger, dbPool *pgxpool.Pool) *challengeCommand {
	return &challengeCommand{
		logger: logger,
		dbPool: dbPool,
	}
}

func (c *challengeCommand) Name() string {
	return "wato-challenge"
}

func (c *challengeCommand) CanActivate(s *discordgo.Session, m discordgo.Message) bool {
	// TODO: Verify it's in a text channel
	// TODO: Verify there are 1 unique mentions (non-bot)
	return strings.Contains(m.Content, `what are the odds `)
}

func (c *challengeCommand) Handler(_ context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	var greeting string
	err := c.dbPool.QueryRow(context.Background(), "select 'Hello, world!'").Scan(&greeting)
	if err != nil {
		return nil, err
	}

	c.logger.Info(greeting)

	return nil, nil
}
