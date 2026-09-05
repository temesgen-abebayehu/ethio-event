package repository

import (
	"context"
	"errors"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type categoryRepository struct {
	db *pgxpool.Pool
}

// NewCategoryRepository builds a Postgres-backed CategoryRepository.
func NewCategoryRepository(db *pgxpool.Pool) domain.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) List(ctx context.Context, activeOnly bool) ([]domain.Category, error) {
	q := `
		SELECT c.id, c.name, c.slug, c.description, c.icon, c.color, c.is_active,
		       (SELECT COUNT(*) FROM events e WHERE e.category_id = c.id)
		FROM categories c`
	if activeOnly {
		q += ` WHERE c.is_active = true`
	}
	q += ` ORDER BY c.name ASC`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Icon, &c.Color, &c.IsActive, &c.EventCount); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *categoryRepository) FindByID(ctx context.Context, id string) (*domain.Category, error) {
	const q = `
		SELECT id, name, slug, description, icon, color, is_active
		FROM categories WHERE id = $1`

	c := &domain.Category{}
	err := r.db.QueryRow(ctx, q, id).Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Icon, &c.Color, &c.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return c, err
}

func (r *categoryRepository) Create(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	const q = `
		INSERT INTO categories (name, slug, description, icon, color, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, slug, description, icon, color, is_active`

	out := &domain.Category{}
	err := r.db.QueryRow(ctx, q, c.Name, c.Slug, c.Description, c.Icon, c.Color, c.IsActive).Scan(
		&out.ID, &out.Name, &out.Slug, &out.Description, &out.Icon, &out.Color, &out.IsActive,
	)
	if isUniqueViolation(err) {
		return nil, domain.ErrConflict
	}
	return out, err
}

func (r *categoryRepository) Update(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	const q = `
		UPDATE categories
		SET name = $2, slug = $3, description = $4, icon = $5, color = $6, is_active = $7
		WHERE id = $1
		RETURNING id, name, slug, description, icon, color, is_active`

	out := &domain.Category{}
	err := r.db.QueryRow(ctx, q, c.ID, c.Name, c.Slug, c.Description, c.Icon, c.Color, c.IsActive).Scan(
		&out.ID, &out.Name, &out.Slug, &out.Description, &out.Icon, &out.Color, &out.IsActive,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if isUniqueViolation(err) {
		return nil, domain.ErrConflict
	}
	return out, err
}

func (r *categoryRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return domain.ErrCategoryInUse
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *categoryRepository) SetActive(ctx context.Context, id string, active bool) error {
	tag, err := r.db.Exec(ctx, `UPDATE categories SET is_active = $2 WHERE id = $1`, id, active)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *categoryRepository) CountEvents(ctx context.Context, id string) (int, error) {
	var n int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM events WHERE category_id = $1`, id).Scan(&n)
	return n, err
}
