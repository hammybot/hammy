package bot

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"slices"
	"strconv"

	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
)

var tempCommand = regexp.MustCompile(`setTemperature (?P<temp>\d\.?\d?)`)
var getSettingsCommand = regexp.MustCompile(`.*getSettings*`)
var resetContextCommand = regexp.MustCompile(`resetContext`)

const resetMessage = "context reset to here!"

type adminCommand struct {
	logger *slog.Logger
	llm    *llm.LLM
}

func newAdminCommand(logger *slog.Logger, llm *llm.LLM) *adminCommand {
	return &adminCommand{
		logger: logger,
		llm:    llm,
	}
}

func (a *adminCommand) Name() string {
	return "admin"
}

func (a *adminCommand) CanActivate(s *discordgo.Session, m discordgo.Message) bool {
	//todo: add more admin commands
	if resetContextCommand.MatchString(m.Content) {
		return true //anyone should be allowed to do this
	}
	
	return isAuthorAdmin(s, m) && (tempCommand.MatchString(m.Content) || getSettingsCommand.MatchString(m.Content))
}

func (a *adminCommand) Handler(_ context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	switch {
	case tempCommand.MatchString(m.Content):
		temp, err := extractTemp(m.Content)
		if err != nil {
			return nil, err
		}

		a.llm.SetTemperature(temp)

		return &discordgo.MessageSend{
			Content: fmt.Sprintf("temperature set to %.2f", temp),
		}, nil
	case getSettingsCommand.MatchString(m.Content):
		settings := a.llm.GetSettings()
		return &discordgo.MessageSend{
			Content: fmt.Sprintf("current settings\n```json\n%+v\n```", settings),
		}, nil
	case resetContextCommand.MatchString(m.Content):
		//this is a flag we will search for in chat to truncate messages
		return &discordgo.MessageSend{
			Content: resetMessage,
		}, nil
	}

	return nil, fmt.Errorf("could not match admin command")
}

func extractTemp(message string) (float32, error) {
	idx := tempCommand.SubexpIndex("temp")
	matches := tempCommand.FindStringSubmatch(message)
	if idx != -1 && len(matches) > idx {
		temp, err := strconv.ParseFloat(matches[idx], 32)
		if err != nil {
			return 0, err
		}
		return float32(temp), nil
	}
	return 0, fmt.Errorf("could not match admin command")
}

func isAuthorAdmin(s *discordgo.Session, m discordgo.Message) bool {
	if m.Member == nil || m.Member.Roles == nil {
		return false
	}

	return slices.ContainsFunc(m.Member.Roles, func(rId string) bool {
		roles, err := s.GuildRoles(m.GuildID)
		if err != nil {
			return false
		}
		if roles == nil {
			return false
		}

		for _, role := range roles {
			if role.ID == rId && (role.Permissions&discordgo.PermissionAdministrator) != 0 {
				return true
			}
		}
		return false
	})
}
