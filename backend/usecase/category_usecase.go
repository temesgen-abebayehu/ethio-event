package usecase

import (
	"context"
	"fmt"

	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"
)

// CategoryUsecase implements admin-managed category CRUD.
type CategoryUsecase struct {
	categories domain.CategoryRepository
}

// NewCategoryUsecase wires the category usecase.
func NewCategoryUsecase(categories domain.CategoryRepository) *CategoryUsecase {
	return &CategoryUsecase{categories: categories}
}

// List returns categories; activeOnly hides deactivated ones (for public filters).
func (u *CategoryUsecase) List(ctx context.Context, activeOnly bool) ([]domain.Category, error) {
	return u.categories.List(ctx, activeOnly)
}

// Create validates and stores a new category.
func (u *CategoryUsecase) Create(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	if err := validateCategoryName(c.Name); err != nil {
		return nil, err
	}
	if c.Slug == "" {
		c.Slug = middleware.Slugify(c.Name)
	}
	return u.categories.Create(ctx, c)
}

// Update validates and applies changes to an existing category.
func (u *CategoryUsecase) Update(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	if err := validateCategoryName(c.Name); err != nil {
		return nil, err
	}
	if c.Slug == "" {
		c.Slug = middleware.Slugify(c.Name)
	}
	return u.categories.Update(ctx, c)
}

// Delete removes a category, or reports ErrCategoryInUse when events reference it
// so the caller can offer deactivation instead of a hard delete.
func (u *CategoryUsecase) Delete(ctx context.Context, id string) error {
	count, err := u.categories.CountEvents(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return domain.ErrCategoryInUse
	}
	return u.categories.Delete(ctx, id)
}

// SetActive activates or deactivates a category (soft-delete alternative).
func (u *CategoryUsecase) SetActive(ctx context.Context, id string, active bool) error {
	return u.categories.SetActive(ctx, id, active)
}

func validateCategoryName(name string) error {
	if l := len(name); l < 2 || l > 50 {
		return fmt.Errorf("%w: category name must be 2–50 characters", domain.ErrInvalidInput)
	}
	return nil
}
