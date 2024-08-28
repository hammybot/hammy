package bot

import (
	"log/slog"
	"os"
	"testing"

	"github.com/austinvalle/hammy/internal/models"
	"github.com/bwmarrin/discordgo"
)

const (
	DM_CHANNEL_ID     = "1"
	PUBLIC_CHANNEL_ID = "2"
)

type testSession struct{}
type mockDb struct{}

func (s *testSession) Channel(id string, opts ...discordgo.RequestOption) (*discordgo.Channel, error) {
	if id == DM_CHANNEL_ID {
		return &discordgo.Channel{Type: discordgo.ChannelTypeDM}, nil
	}
	return &discordgo.Channel{Type: discordgo.ChannelTypeGuildText}, nil
}

func (db *mockDb) CreateNewChallenge(c *models.WatoChallenge) error {
	return nil
}

func TestWatoCanActivate(t *testing.T) {
	testSession := &testSession{}

	var (
		// buff       bytes.Buffer
		MockLogger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
		MockDb = &mockDb{}
	)

	challenge := newWatoCommand(MockLogger, MockDb)

	var tests = []struct {
		name string
		m    discordgo.Message
		want bool
	}{
		{"valid dm response", discordgo.Message{ChannelID: DM_CHANNEL_ID, Content: "4"}, true},
		{"invalid dm response", discordgo.Message{ChannelID: DM_CHANNEL_ID, Content: "bad int"}, false},
		{"valid wato start", discordgo.Message{ChannelID: PUBLIC_CHANNEL_ID, Content: "what are the odds that this test passes"}, true},
		{"random public message", discordgo.Message{ChannelID: PUBLIC_CHANNEL_ID, Content: "random message"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ans := challenge.CanActivate(testSession, tt.m)
			if ans != tt.want {
				t.Errorf("got %t, want %t", ans, tt.want)
			}
		})
	}
}
