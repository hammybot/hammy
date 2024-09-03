package bot

import (
	"context"
	"fmt"
	"github.com/austinvalle/hammy/internal/command"
	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
	"github.com/spf13/viper"
	"golang.org/x/exp/slices"
	"log/slog"
	"regexp"
	"strings"
)

const (
	urlPattern = ".*(?P<url>https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)).*"
)

type summarizeCommand struct {
	logger *slog.Logger
	llm    *llm.LLM
}

func newSummarizeCommand(logger *slog.Logger, llm *llm.LLM) command.TextCommand {
	return &summarizeCommand{
		logger: logger,
		llm:    llm,
	}
}
func (c *summarizeCommand) Name() string {
	return "analyze"
}

func (c *summarizeCommand) CanActivate(s *discordgo.Session, m discordgo.Message) bool {
	urlRegex := regexp.MustCompile(urlPattern)

	//don't respond if we are not tagged, embeds don't use mention for bots, its mention role
	lookupMentionRole := func(roleId string) bool {
		role, err := s.State.Role(m.GuildID, roleId)
		if err != nil {
			c.logger.Error("Unable to lookup discord role for analysis activation", "roleId", m.MentionRoles[0])
			return false
		}
		return role.Name == s.State.User.Username
	}

	if !slices.ContainsFunc(m.MentionRoles, lookupMentionRole) {
		return false
	}

	matches := urlRegex.FindStringSubmatch(m.Content)
	idx := urlRegex.SubexpIndex("url")

	if len(matches) < idx+1 || matches[idx] == "" {
		return false
	}

	return true
}

func (c *summarizeCommand) Handler(ctx context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	//todo: dont rawdog viper
	if err := s.MessageReactionAdd(m.ChannelID, m.ID, viper.GetString("ResponseEmoji")); err != nil {
		c.logger.Error("error adding reaction: ", err)
	}

	urlRegex := regexp.MustCompile(urlPattern)
	c.logger.Debug("In summary handler")

	blacklistedSites := []string{"twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com", "google.com"}

	matches := urlRegex.FindStringSubmatch(m.Content)
	idx := urlRegex.SubexpIndex("url")
	if len(matches) < idx+1 || matches[idx] == "" {
		return nil, fmt.Errorf("URL regex did not match")
	}
	url := matches[idx]
	isBlacklisted := slices.ContainsFunc(blacklistedSites, func(site string) bool {
		return strings.Contains(url, site)
	})

	if isBlacklisted {
		return &discordgo.MessageSend{
			Content: fmt.Sprintf("Hmm, %s it looks like you provided a link that I cannot analyze!", m.Author.Mention()),
		}, nil

	}

	response, err := c.llm.Analyze(ctx, url, m)
	if err != nil {
		c.logger.Error("error in analyzing message", err)
		return nil, err
	}

	return &discordgo.MessageSend{
		Content: fmt.Sprintf(response),
	}, nil

}
