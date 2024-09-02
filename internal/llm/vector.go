package llm

import (
	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/vectorstores/chroma"
)

type meta = map[string]any

func newVectorStore(llm *ollama.LLM) (chroma.Store, error) {
	embedder, err := embeddings.NewEmbedder(llm)
	if err != nil {
		panic(err)
	}

	return chroma.New(
		chroma.WithChromaURL("http://localhost:8000"),
		chroma.WithEmbedder(embedder),
		chroma.WithDistanceFunction("cosine"),
		chroma.WithNameSpace("grapevine"),
	)
}

func batchDocuments(documents []schema.Document, batchSize int) [][]schema.Document {
	var batches [][]schema.Document
	for i := 0; i < len(documents); i += batchSize {
		end := i + batchSize
		if end > len(documents) {
			end = len(documents)
		}
		batches = append(batches, documents[i:end])
	}
	return batches
}

//
//func QueryStore(ctx context.Context, logger *slog.Logger, user string) {
//	llm, err := newClient()
//	if err != nil {
//		panic(err)
//	}
//	store, err := newVectorStore(llm)
//	if err != nil {
//		panic(err)
//	}
//	logger.Debug("querying store")
//	docs, err := store.SimilaritySearch(ctx,
//		"what has puba said?",
//		100,
//		vectorstores.WithNameSpace("grapevine"),
//		vectorstores.WithScoreThreshold(0.7),
//	)
//	logger.Debug(fmt.Sprintf("got documents: %d", len(docs)))
//	if len(docs) == 0 {
//
//		return
//	}
//	content := ""
//	for _, doc := range docs {
//		content += doc.PageContent + "\n"
//	}
//	logger.Debug("sending to llm")
//
//	query := fmt.Sprintf("Hammy is something you know about %s", user)
//	prompt := prompts.NewChatPromptTemplate([]prompts.MessageFormatter{
//		prompts.NewSystemMessagePromptTemplate(
//			`You are a conversation bot named Hammy, You are a cyborg pig with regular human intelligence and dialect. Sometimes people ask you about others and you have additional chat history from that person to help give you more knowledge, use the provided chat history to participate in the conversation. {{.history}}`,
//			[]string{"history"},
//		),
//		prompts.NewHumanMessagePromptTemplate(
//			query,
//			nil,
//		),
//	})
//
//	msgs, err := prompt.Format(map[string]any{
//		"history": content,
//	})
//	if err != nil {
//		panic(err)
//	}
//	response, err := llms.GenerateFromSinglePrompt(ctx, llm, msgs)
//	if err != nil {
//		panic(err)
//	}
//	logger.Debug(fmt.Sprintf("got response: %v\n", response))
//}
//
//func DoEmbed(ctx context.Context, logger *slog.Logger, messages []Message) {
//	llm, err := newClient()
//	if err != nil {
//		panic(err)
//	}
//
//	store, err := newVectorStore(llm)
//	if err != nil {
//		panic(err)
//	}
//
//	var documents []schema.Document
//	logger.Debug("batching")
//	for _, message := range messages {
//		if message.Author.IsBot {
//			continue
//		}
//
//		documents = append(documents, schema.Document{
//			PageContent: fmt.Sprintf("%s said: %s", message.Author.Name, message.Content),
//			Metadata:    message.metadata(),
//			Score:       0,
//		})
//	}
//
//	batches := batchDocuments(documents, 10)
//	logger.Debug("adding docs")
//	for i, batch := range batches {
//		logger.Debug(fmt.Sprintf("adding batch %d of %d", i+1, len(batches)))
//		_, errAdd := store.AddDocuments(ctx, batch)
//		if errAdd != nil {
//			panic(errAdd)
//		}
//	}
//
//	logger.Debug("done adding docs")
//}
