package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"local-event-backend/domain"
	"local-event-backend/repository/dto"

	"github.com/jackc/pgx/v5/pgxpool"
)

type interactionRepository struct {
	db *pgxpool.Pool
}

// NewInteractionRepository builds a Postgres-backed InteractionRepository.
func NewInteractionRepository(db *pgxpool.Pool) domain.InteractionRepository {
	return &interactionRepository{db: db}
}

func (r *interactionRepository) AddBookmark(ctx context.Context, userID, eventID string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO bookmarks (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, eventID)
	return err
}

func (r *interactionRepository) RemoveBookmark(ctx context.Context, userID, eventID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM bookmarks WHERE user_id = $1 AND event_id = $2`, userID, eventID)
	return err
}

func (r *interactionRepository) AddFollow(ctx context.Context, userID, eventID string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO follows (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, eventID)
	return err
}

func (r *interactionRepository) RemoveFollow(ctx context.Context, userID, eventID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM follows WHERE user_id = $1 AND event_id = $2`, userID, eventID)
	return err
}

func (r *interactionRepository) Status(ctx context.Context, userID, eventID string) (bool, bool, error) {
	const q = `
		SELECT
			EXISTS (SELECT 1 FROM bookmarks WHERE user_id = $1 AND event_id = $2),
			EXISTS (SELECT 1 FROM follows   WHERE user_id = $1 AND event_id = $2)`
	var bookmarked, following bool
	err := r.db.QueryRow(ctx, q, userID, eventID).Scan(&bookmarked, &following)
	return bookmarked, following, err
}

func (r *interactionRepository) ListBookmarkedEvents(ctx context.Context, userID string) ([]domain.Event, error) {
	return r.listLinkedEvents(ctx, "bookmarks", userID)
}

func (r *interactionRepository) ListFollowedEvents(ctx context.Context, userID string) ([]domain.Event, error) {
	return r.listLinkedEvents(ctx, "follows", userID)
}

// listLinkedEvents returns the events referenced by a bookmarks/follows table.
func (r *interactionRepository) listLinkedEvents(ctx context.Context, table, userID string) ([]domain.Event, error) {
	q := fmt.Sprintf(`
		SELECT %s FROM events e
		JOIN %s x ON x.event_id = e.id
		WHERE x.user_id = $1
		ORDER BY e.event_date ASC`, eventJSONExpr, table)

	rows, err := r.db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []domain.Event{}
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
		var row dto.EventRow
		if err := json.Unmarshal(raw, &row); err != nil {
			return nil, err
		}
		events = append(events, row.ToDomain())
	}
	return events, rows.Err()
}
