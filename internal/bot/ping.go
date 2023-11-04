package bot

import (
	"fmt"
	"time"

	"github.com/bwmarrin/discordgo"
)

const (
	pingName        = "ping"
	pingDescription = "Send a ping to hammy"
)

func ping(ctx botContext, event *discordgo.InteractionCreate) error {
	start := time.Now()
	err := ctx.session.InteractionRespond(event.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Flags: discordgo.MessageFlagsEphemeral,
		},
	})
	elapsed := time.Since(start)
	if err != nil {
		return err
	}
	_, err = ctx.session.FollowupMessageCreate(event.Interaction, true, &discordgo.WebhookParams{
		Content: fmt.Sprintf("Pong! :ping_pong: `%dms`", elapsed.Milliseconds()),
	})

	return err
}
