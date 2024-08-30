package main

import (
	"context"
	"github.com/austinvalle/hammy/internal/llm"
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	ctx := context.Background()
	logger.Debug("started")
	//fmt.Println(llm.Chat(context.Background(), "Hello, how are you doing?"))
	//home, err := os.UserHomeDir()
	//if err != nil {
	//	panic(err)
	//}
	//
	//file, err := os.ReadFile(home + "/Downloads/The Bunch - Text - the-grapevine [583735434199171111].json")
	//if err != nil {
	//	panic(err)
	//}
	//
	//var history llm.History
	//logger.Debug("unmarshalling")
	//err = json.Unmarshal(file, &history)
	//if err != nil {
	//	panic(err)
	//}
	//if len(history.Messages) == 0 {
	//	logger.Debug("no messages")
	//	return
	//}
	//
	//llm.DoEmbed(ctx, logger, history.Messages)
	llm.QueryStore(ctx, logger, "RVinCBus")
}
