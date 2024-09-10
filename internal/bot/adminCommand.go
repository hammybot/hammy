package bot

import (
	"context"
	"fmt"
	"github.com/austinvalle/hammy/internal/llm"
	"github.com/bwmarrin/discordgo"
	"log/slog"
	"regexp"
	"slices"
	"strconv"
)

var tempCommand *regexp.Regexp

func init() {
	tempCommand = regexp.MustCompile(`setTemperature (?P<temp>\d\.?\d?)`)
}

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

	return isAuthorAdmin(s, m) && tempCommand.MatchString(m.Content)
}

func (a *adminCommand) Handler(_ context.Context, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.MessageSend, error) {
	if tempCommand.MatchString(m.Content) {
		temp, err := extractTemp(m.Content)
		if err != nil {
			return nil, err
		}

		a.llm.SetTemperature(temp)

		return &discordgo.MessageSend{
			Content: fmt.Sprintf("temperature set to %.2f", temp),
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
	return slices.ContainsFunc(m.Member.Roles, func(rId string) bool {
		roles, err := s.GuildRoles(m.GuildID)
		if err != nil {
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
