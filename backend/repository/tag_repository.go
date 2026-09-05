package repository

import (
	"context"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type tagRepository struct {
	db *pgxpool.Pool
}

// NewTagRepository builds a Postgres-backed TagRepository.
func NewTagRepository(db *pgxpool.Pool) domain.TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) List(ctx context.Context) ([]domain.Tag, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Tag
	for rows.Next() {
		var t domain.Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
