package repository

import (
	"context"
	"errors"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository builds a Postgres-backed UserRepository.
func NewUserRepository(db *pgxpool.Pool) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *domain.User) (*domain.User, error) {
	const q = `
		INSERT INTO users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, full_name, phone, avatar_url, city, role, created_at, updated_at`

	role := u.Role
	if role == "" {
		role = domain.RoleUser
	}

	out := &domain.User{}
	err := r.db.QueryRow(ctx, q, u.Email, u.PasswordHash, u.FullName, role).Scan(
		&out.ID, &out.Email, &out.FullName, &out.Phone, &out.AvatarURL, &out.City, &out.Role, &out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return out, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	const q = `
		SELECT id, email, password_hash, full_name, phone, avatar_url, city, role, created_at, updated_at
		FROM users WHERE email = $1`

	out := &domain.User{}
	err := r.db.QueryRow(ctx, q, email).Scan(
		&out.ID, &out.Email, &out.PasswordHash, &out.FullName, &out.Phone, &out.AvatarURL, &out.City, &out.Role, &out.CreatedAt, &out.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return out, err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	const q = `
		SELECT id, email, password_hash, full_name, phone, avatar_url, city, role, created_at, updated_at
		FROM users WHERE id = $1`

	out := &domain.User{}
	err := r.db.QueryRow(ctx, q, id).Scan(
		&out.ID, &out.Email, &out.PasswordHash, &out.FullName, &out.Phone, &out.AvatarURL, &out.City, &out.Role, &out.CreatedAt, &out.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return out, err
}

// UpdateProfile updates the editable profile fields and returns the fresh user.
func (r *userRepository) UpdateProfile(ctx context.Context, userID, fullName string, phone, city, avatarURL *string) (*domain.User, error) {
	const q = `
		UPDATE users SET full_name = $2, phone = $3, city = $4, avatar_url = $5, updated_at = NOW()
		WHERE id = $1
		RETURNING id, email, full_name, phone, avatar_url, city, role, created_at, updated_at`

	out := &domain.User{}
	err := r.db.QueryRow(ctx, q, userID, fullName, phone, city, avatarURL).Scan(
		&out.ID, &out.Email, &out.FullName, &out.Phone, &out.AvatarURL, &out.City, &out.Role, &out.CreatedAt, &out.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return out, err
}

func (r *userRepository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET password_hash = $2 WHERE id = $1`, userID, passwordHash)
	return err
}
