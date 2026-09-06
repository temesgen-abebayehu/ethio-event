package usecase

import (
	"context"

	"local-event-backend/domain"
)

// InteractionUsecase implements bookmark and follow actions.
type InteractionUsecase struct {
	interactions domain.InteractionRepository
}

// NewInteractionUsecase wires the interaction usecase.
func NewInteractionUsecase(interactions domain.InteractionRepository) *InteractionUsecase {
	return &InteractionUsecase{interactions: interactions}
}

func (u *InteractionUsecase) Bookmark(ctx context.Context, userID, eventID string) error {
	return u.interactions.AddBookmark(ctx, userID, eventID)
}

func (u *InteractionUsecase) RemoveBookmark(ctx context.Context, userID, eventID string) error {
	return u.interactions.RemoveBookmark(ctx, userID, eventID)
}

func (u *InteractionUsecase) Follow(ctx context.Context, userID, eventID string) error {
	return u.interactions.AddFollow(ctx, userID, eventID)
}

func (u *InteractionUsecase) Unfollow(ctx context.Context, userID, eventID string) error {
	return u.interactions.RemoveFollow(ctx, userID, eventID)
}

// Status reports whether the user has bookmarked and/or is following the event.
func (u *InteractionUsecase) Status(ctx context.Context, userID, eventID string) (bookmarked, following bool, err error) {
	return u.interactions.Status(ctx, userID, eventID)
}

func (u *InteractionUsecase) Bookmarks(ctx context.Context, userID string) ([]domain.Event, error) {
	return u.interactions.ListBookmarkedEvents(ctx, userID)
}

func (u *InteractionUsecase) Follows(ctx context.Context, userID string) ([]domain.Event, error) {
	return u.interactions.ListFollowedEvents(ctx, userID)
}
