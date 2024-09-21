package llm

import (
	"strings"
	"time"
)

type History struct {
	Messages []Message `json:"messages"`
}
type Mention struct {
	Name     string `json:"name"`
	Nickname string `json:"nickname"`
	IsBot    bool   `json:"is_bot"`
}

type Message struct {
	Timestamp time.Time `json:"timestamp"`
	Content   string    `json:"content"`
	Author    Author    `json:"author"`
	Mentions  []Mention `json:"mentions"`
}
type Author struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	Nickname  string `json:"nickname"`
	IsBot     bool   `json:"is_bot"`
	AvatarUrl string `json:"avatar_url"`
}

func (m Message) metadata() meta { //nolint:unused
	mentions := []string{}

	for _, mention := range m.Mentions {
		mentions = append(mentions, mention.Name)
	}
	metadata := meta{
		"author_name":     m.Author.Name,
		"timestamp":       m.Timestamp,
		"content":         m.Content,
		"author_nickname": m.Author.Nickname,
	}
	if len(mentions) > 0 {
		metadata["mentions"] = strings.Join(mentions, ",")
	}
	return metadata
}
