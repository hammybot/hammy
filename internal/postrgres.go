package internal

import (
	"database/sql"
	"fmt"
	"log/slog"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/austinvalle/hammy/internal/models"
	"github.com/dgryski/trifles/uuid"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

const (
	challenges_Table = "challenges"
)

type Postgres struct {
	db *sqlx.DB
	l  *slog.Logger
}
type DbConfig struct {
	Host     string
	User     string
	Password string
	Port     int
	Schema   string
	Dbname   string
	Ssl      bool
}

func CreateNewPostgres(c DbConfig, l *slog.Logger) (*Postgres, error) {
	cs := fmt.Sprintf("host=%s port=%d user=%s "+
		"password=%s dbname=%s",
		c.Host, c.Port, c.User, c.Password, c.Dbname)

	if !c.Ssl {
		cs += " sslmode=disable"
	}

	db, err := sqlx.Connect("postgres", cs)

	if err != nil {
		return nil, fmt.Errorf("could not connect to db: %v", err)
	}

	//todo: create db
	return &Postgres{db: db}, nil
}

func (p *Postgres) CreateNewChallenge(m *models.WatoChallenge) error {
	q := sq.Insert(challenges_Table).
		Columns("id", "challengedId", "challengerId", "channelId", "description", "status").
		Values(uuid.New(), m.ChallengedId, m.ChallengerId, m.ChannelId, m.Description, m.Status).
		RunWith(p.db)
	_, err := q.Exec()

	if err != nil {
		p.l.Error("could not insert wato challenge into db, channel:%s, challenger:%s, challenged: %s")
		return fmt.Errorf("could not create new wato challenge: %v", err)
	}

	return nil
}

func (p *Postgres) RetrieveChallenge(id string) (c *models.WatoChallenge, err error) {
	q, args, err := sq.Select("*").From(challenges_Table).Where("id = ?", id).ToSql()

	if err != nil {
		return nil, fmt.Errorf("could not fetch challenge:%s error: %v", id, err)
	}

	row := p.db.QueryRowx(q, args...)

	err = row.StructScan(c)

	if err != nil {
		return nil, fmt.Errorf("could not fetch challenge:%s error: %v", id, err)
	}

	return c, nil

}

func (p *Postgres) GetChallengeForUser(id string) (*models.WatoChallenge, error) {
	var c *models.WatoChallenge

	q, args, err := sq.Select("*").From(challenges_Table).Where(
		sq.Eq{"challengedId": id},
		sq.Eq{"challengerId": id},
	).ToSql()

	if err != nil {
		return nil, fmt.Errorf("could not get challenge by userid: %v", err)
	}

	row := p.db.QueryRowx(q, args...)

	err = row.StructScan(c)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		p.l.Error("error fetching challenge by user id", "error", err)
		return nil, err
	}

	return c, nil
}

func (p *Postgres) HasActiveChallenge(ids []string) bool {
	var count int
	w := sq.Or{}

	for _, id := range ids {
		w = append(w, sq.Eq{"challengerId": id, "challengedId": id})
	}

	q, args, err := sq.Select("count *").From(challenges_Table).Where(w).ToSql()

	if err != nil {
		p.l.Error("could not check to see if active user exists for users", slog.String("userIds", strings.Join(ids, ",")))
		return false
	}

	err = p.db.QueryRowx(q, args...).Scan(&count)

	if err != nil {
		p.l.Error("could not parse scan hasActiveChallenge", "error", err)
		return false
	}

	return count != 0
}
