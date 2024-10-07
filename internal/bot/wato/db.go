package wato

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type challengeStatus string

const (
	pendingAccept challengeStatus = "PND"
	pendingBets   challengeStatus = "BET"
	declined      challengeStatus = "DEC"
	completed     challengeStatus = "CMP"
)

type challenge struct {
	ID                 int
	ChallengerID       string
	ChallengedID       string
	ChannelID          string
	StatusMessageID    *string
	Description        string
	Status             challengeStatus
	BetLimit           *int
	WinnerID           *string
	ChallengerBet      *int
	ChallengedBet      *int
	CreationTimestamp  time.Time
	CompletedTimestamp *time.Time
}

func createNewChallenge(dbPool *pgxpool.Pool, c challenge) error {
	insertQuery := `
		INSERT INTO public.challenges (
			"ChallengerId", "ChallengedId", "ChannelId", "Description", "Status"
		)
		VALUES (
			$1, $2, $3, $4, $5
		)
	
	`
	_, err := dbPool.Exec(context.Background(), insertQuery, c.ChallengerID, c.ChallengedID, c.ChannelID, c.Description, c.Status)

	return err
}

func getActiveChallenge(dbPool *pgxpool.Pool, userID string) (*challenge, error) {
	getActiveChallengeQuery := `
		SELECT * FROM public.challenges
		WHERE ("ChallengerId" = $1 OR "ChallengedId" = $1)
			AND "Status" NOT IN ('CMP', 'DEC');
	`
	rows, err := dbPool.Query(context.Background(), getActiveChallengeQuery, userID)
	if err != nil {
		return nil, err
	}

	c, err := pgx.CollectOneRow(rows, func(row pgx.CollectableRow) (challenge, error) {
		return pgx.RowToStructByNameLax[challenge](row)
	})

	if err != nil {
		return nil, err
	}

	return &c, nil
}

func setStatusMessageID(dbPool *pgxpool.Pool, c challenge, msgID string) error {
	updateQuery := `
		UPDATE public.challenges
		SET "StatusMessageId"= $1
		WHERE "Id"= $2
	
	`
	_, err := dbPool.Exec(context.Background(), updateQuery, msgID, c.ID)

	return err
}

func setBetLimit(dbPool *pgxpool.Pool, c challenge, betLimit int) error {
	updateQuery := `
		UPDATE public.challenges
		SET "Status"= $1,
			"BetLimit"= $2
		WHERE "Id"= $3
	
	`
	_, err := dbPool.Exec(context.Background(), updateQuery, pendingBets, betLimit, c.ID)

	return err
}

func declineChallenge(dbPool *pgxpool.Pool, c challenge) error {
	updateQuery := `
		UPDATE public.challenges
		SET "Status"= $1,
			"CompletedTimestamp"= now()
		WHERE "Id"= $2
	
	`
	_, err := dbPool.Exec(context.Background(), updateQuery, declined, c.ID)

	return err
}
