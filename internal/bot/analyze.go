package bot

import (
	"fmt"
	"github.com/austinvalle/hammy/internal/command"
	"github.com/bwmarrin/discordgo"
	"log/slog"
	"regexp"
	"strings"
)

const (
	hammyUsername = "hammy"
	urlPattern    = ".*(?P<url>https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)).*"
)

type summarizeCommand struct {
	logger *slog.Logger
}

func newSummarizeCommand(logger *slog.Logger) command.TextCommand {
	return &summarizeCommand{
		logger: logger,
	}
}
func (c *summarizeCommand) Name() string {
	return "summarize"
}

func (c *summarizeCommand) CanActivate(r command.DiscordChannelRetriever, m discordgo.Message) bool {
	urlRegex := regexp.MustCompile(urlPattern)
	isHammy := false
	for _, mention := range m.Mentions {
		if mention.Username == hammyUsername {
			isHammy = true
			break
		}
	}
	if !isHammy {
		return false
	}
	matches := urlRegex.FindStringSubmatch(m.Content)
	idx := urlRegex.SubexpIndex("url")

	if len(matches) != 2 || matches[idx] == "" {
		return false
	}

	return true
}

func (c *summarizeCommand) Handler(s *discordgo.Session, m *discordgo.MessageCreate) error {
	urlRegex := regexp.MustCompile(urlPattern)
	c.logger.Debug("In summary handler")
	blacklistedSites := []string{"twitter.com", "x.com", "facebook.com", "instagram.com"}

	matches := urlRegex.FindStringSubmatch(m.Content)
	idx := urlRegex.SubexpIndex("url")
	if len(matches) != 2 || matches[idx] == "" {
		return fmt.Errorf("URL regex did not match")
	}
	isBlacklisted := false
	url := matches[idx]
	for _, site := range blacklistedSites {
		if strings.Contains(url, site) {
			isBlacklisted = true
			break
		}
	}

	if isBlacklisted {
		if _, err := s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Hmm, %s it looks like you provided a link that I cannot analyze!", m.Author.Mention())); err != nil {
			c.logger.Error("error in sending message", err)
			return err
		}

		return nil
	}

	//respond

}
