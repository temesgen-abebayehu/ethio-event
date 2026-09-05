package usecase

import (
	"context"

	"local-event-backend/domain"
)

// TagUsecase exposes tag listing.
type TagUsecase struct {
	tags domain.TagRepository
}

// NewTagUsecase wires the tag usecase.
func NewTagUsecase(tags domain.TagRepository) *TagUsecase {
	return &TagUsecase{tags: tags}
}

// List returns all tags.
func (u *TagUsecase) List(ctx context.Context) ([]domain.Tag, error) {
	return u.tags.List(ctx)
}
