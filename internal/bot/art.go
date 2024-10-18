package bot

import (
	"bytes"
	"context"
	"fmt"
	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
	"github.com/google/uuid"
	"log/slog"
	"strings"
)

type imageCommand struct {
	logger *slog.Logger
	llm    *llm.LLM
}

func newImageCommand(logger *slog.Logger, llm *llm.LLM) *imageCommand {
	return &imageCommand{
		logger: logger,
		llm:    llm,
	}
}

func (c *imageCommand) Name() string {
	return "image"
}

// todo: we should make this a slash command
func (c *imageCommand) CanActivate(s *discordgo.Session, m discordgo.Message) bool {
	//!art {prompt}
	return strings.HasPrefix(m.Content, "!art ") && len(m.Content) > 5
}

func (c *imageCommand) Handler(ctx context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	if err := s.MessageReactionAdd(m.ChannelID, m.ID, "\U0001F58C"); err != nil {
		c.logger.Error("error adding reaction: ", "err", err)
	}

	prompt, ok := strings.CutPrefix(m.Content, "!art ")

	if !ok {
		return nil, fmt.Errorf("could not extract prompt from art command")
	}

	img, err := c.llm.GenerateImage(ctx, prompt)

	if err != nil {
		return nil, err
	}

	return &discordgo.MessageSend{
		Content: fmt.Sprintf("%s %s", m.Author.Mention(), prompt),
		Files: []*discordgo.File{
			{
				Name:        uuid.New().String() + ".jpg",
				ContentType: "JPEG",
				Reader:      bytes.NewReader(img),
			},
		},
	}, nil
}
