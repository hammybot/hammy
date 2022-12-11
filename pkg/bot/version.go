package bot

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"strconv"

	"github.com/bwmarrin/discordgo"
)

const (
	versionName        = "version"
	versionDescription = "Check hammy's version info"

	refUrl       = "[%s](https://github.com/austinvalle/hammy/tree/%s)"
	hammyLogoUrl = "https://raw.githubusercontent.com/austinvalle/hammy/main/assets/hammy-viking.png"
)

// Overriden by build flags/binary info
var vcsShortSha = ""
var vcsSha = ""
var vcsModified = false

func init() {
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, s := range info.Settings {
			switch s.Key {
			case "vcs.modified":
				vcsModified, _ = strconv.ParseBool(s.Value)
			case "vcs.revision":
				vcsSha = s.Value
				vcsShortSha = s.Value[:7]
			}
		}
	}
}

func version(ctx botContext, event *discordgo.InteractionCreate) error {
	embed := &discordgo.MessageEmbed{
		Fields: []*discordgo.MessageEmbedField{
			getVcsInfo(),
			getOSInfo(),
		},
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: hammyLogoUrl,
		},
	}

	return ctx.session.InteractionRespond(event.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,

		Data: &discordgo.InteractionResponseData{
			Flags:  discordgo.MessageFlagsEphemeral,
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func getVcsInfo() *discordgo.MessageEmbedField {
	commitMsg := fmt.Sprintf(refUrl, vcsShortSha, vcsSha)
	if vcsModified {
		commitMsg = ":construction: _local changes_ :construction:"
	}

	return &discordgo.MessageEmbedField{
		Name:  "Commit",
		Value: commitMsg,
	}
}

func getOSInfo() *discordgo.MessageEmbedField {
	return &discordgo.MessageEmbedField{
		Name:  "OS",
		Value: fmt.Sprintf("`%s/%s`", runtime.GOOS, runtime.GOARCH),
	}
}
