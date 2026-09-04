package repository

import (
	"context"
	"errors"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type passwordResetRepository struct {
	db *pgxpool.Pool
}

// NewPasswordResetRepository builds a Postgres-backed PasswordResetRepository.
func NewPasswordResetRepository(db *pgxpool.Pool) domain.PasswordResetRepository {
	return &passwordResetRepository{db: db}
}

func (r *passwordResetRepository) Create(ctx context.Context, pr *domain.PasswordReset) error {
	const q = `
		INSERT INTO password_resets (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`
	_, err := r.db.Exec(ctx, q, pr.UserID, pr.TokenHash, pr.ExpiresAt)
	return err
}

func (r *passwordResetRepository) FindValidByHash(ctx context.Context, tokenHash string) (*domain.PasswordReset, error) {
	const q = `
		SELECT id, user_id, token_hash, expires_at, used_at
		FROM password_resets
		WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`

	out := &domain.PasswordReset{}
	err := r.db.QueryRow(ctx, q, tokenHash).Scan(&out.ID, &out.UserID, &out.TokenHash, &out.ExpiresAt, &out.UsedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return out, err
}

func (r *passwordResetRepository) MarkUsed(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE password_resets SET used_at = NOW() WHERE id = $1`, id)
	return err
}
