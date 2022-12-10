package bot

import (
	"testing"

	"github.com/bwmarrin/discordgo"
)

type handlerSpy struct {
	called bool
}

func (h *handlerSpy) handler(ctx messageContext) error {
	h.called = true
	return nil
}

func TestReadNewUserMessage(t *testing.T) {
	t.Run("bad regex, skip handler", func(t *testing.T) {
		spy := handlerSpy{}

		_, err := readNewUserMessage(spy.handler, "[")
		if err == nil {
			t.Fatal("expected err, but did not receive one")
		}
	})

	t.Run("bot ignores messages from itself", func(t *testing.T) {
		spy := handlerSpy{}

		h, err := readNewUserMessage(spy.handler, "^!test$")
		if err != nil {
			t.Fatalf("did not expect err, but got :%v", err)
		}

		h(&discordgo.Session{
			State: &discordgo.State{
				Ready: discordgo.Ready{
					User: &discordgo.User{
						ID: "bot123",
					},
				},
			},
		}, &discordgo.MessageCreate{
			Message: &discordgo.Message{
				Author: &discordgo.User{
					ID: "bot123",
				},
			},
		})

		if spy.called {
			t.Fatal("expected handler to not be called, but it was")
		}
	})

	t.Run("bot ignores messages if no match", func(t *testing.T) {
		spy := handlerSpy{}

		h, err := readNewUserMessage(spy.handler, "^!test$")
		if err != nil {
			t.Fatalf("did not expect err, but got :%v", err)
		}

		h(&discordgo.Session{
			State: &discordgo.State{
				Ready: discordgo.Ready{
					User: &discordgo.User{
						ID: "bot123",
					},
				},
			},
		}, &discordgo.MessageCreate{
			Message: &discordgo.Message{
				Content: "!definitelynot!test",
				Author: &discordgo.User{
					ID: "user123",
				},
			},
		})

		if spy.called {
			t.Fatal("expected handler to not be called, but it was")
		}
	})

	t.Run("bot calls handler when it matches regex", func(t *testing.T) {
		spy := handlerSpy{}

		h, err := readNewUserMessage(spy.handler, "^!test$")
		if err != nil {
			t.Fatalf("did not expect err, but got :%v", err)
		}

		h(&discordgo.Session{
			State: &discordgo.State{
				Ready: discordgo.Ready{
					User: &discordgo.User{
						ID: "bot123",
					},
				},
			},
		}, &discordgo.MessageCreate{
			Message: &discordgo.Message{
				Content: "!test",
				Author: &discordgo.User{
					ID: "user123",
				},
			},
		})

		if !spy.called {
			t.Fatal("expected handler to be called, but it was not")
		}
	})
}
