package bot

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/austinvalle/hammy/internal/command"
	"github.com/bwmarrin/discordgo"
)

// pingCommand responds to a /ping command with a message and then edits the message to loosely display latency
type pingCommand struct{}

func newPingCommand() command.InteractionCreate {
	return &pingCommand{}
}

func (c *pingCommand) Name() string {
	return "ping"
}

func (c *pingCommand) Description() string {
	return "Send a ping to hammy"
}

func (c *pingCommand) Run(logger *slog.Logger, session *discordgo.Session, event *discordgo.InteractionCreate) error {
	start := time.Now()
	err := session.InteractionRespond(event.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Flags: discordgo.MessageFlagsEphemeral,
		},
	})
	elapsed := time.Since(start)
	if err != nil {
		return err
	}
	_, err = session.FollowupMessageCreate(event.Interaction, true, &discordgo.WebhookParams{
		Content: fmt.Sprintf("Pong! :ping_pong: `%dms`", elapsed.Milliseconds()),
	})

	return err
}
