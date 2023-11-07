package bot

import (
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

const WATO_PATTERN = "^what are the odds .*"

type watoCommand struct{}

func newWatoCommand() *watoCommand {
	return &watoCommand{}
}

func (h *watoCommand) Name() string {
	return "WATO"
}
func (h *watoCommand) Pattern() string {
	return WATO_PATTERN
}
func (h *watoCommand) Handler(logger *slog.Logger, s *discordgo.Session, m *discordgo.MessageCreate) error {
	logger.Debug("entered handler")

	//todo: logic for wato
	logger.Debug("received wato challenge", "content", m.Content)

	return nil
}
