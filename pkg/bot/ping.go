package bot

import "github.com/bwmarrin/discordgo"

const (
	pingName        = `ping`
	pingDescription = `Send a ping to hammy`
)

func ping(ctx messageContext) error {
	return ctx.session.InteractionRespond(ctx.event.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Flags:   discordgo.MessageFlagsEphemeral,
			Content: "Ayo! It's your boy",
		},
	})
}
