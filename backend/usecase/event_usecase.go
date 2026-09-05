package usecase

import (
	"context"
	"fmt"
	"time"

	"local-event-backend/domain"
)

// EventUsecase implements event discovery and management with server-side rules.
type EventUsecase struct {
	events     domain.EventRepository
	categories domain.CategoryRepository
}

// NewEventUsecase wires the event usecase.
func NewEventUsecase(events domain.EventRepository, categories domain.CategoryRepository) *EventUsecase {
	return &EventUsecase{events: events, categories: categories}
}

// List returns published events matching the filter, plus the total count.
func (u *EventUsecase) List(ctx context.Context, f domain.EventFilter) ([]domain.Event, int, error) {
	return u.events.List(ctx, f)
}

// ListByOrganizer returns every event owned by a user (drafts included).
func (u *EventUsecase) ListByOrganizer(ctx context.Context, userID string) ([]domain.Event, int, error) {
	return u.events.List(ctx, domain.EventFilter{OrganizerID: userID, Sort: "created_at", Order: "desc", Limit: 100})
}

// Get returns a single event; publicOnly hides drafts.
func (u *EventUsecase) Get(ctx context.Context, idOrSlug string, publicOnly bool) (*domain.Event, error) {
	return u.events.FindByIDOrSlug(ctx, idOrSlug, publicOnly)
}

// Nearby returns events within radiusKM of a coordinate.
func (u *EventUsecase) Nearby(ctx context.Context, lat, lng, radiusKM float64) ([]domain.NearbyEvent, error) {
	return u.events.Nearby(ctx, lat, lng, radiusKM)
}

// Create validates the input and publishes a new event owned by userID.
func (u *EventUsecase) Create(ctx context.Context, userID string, in domain.EventInput) (*domain.Event, error) {
	if err := u.validate(ctx, in); err != nil {
		return nil, err
	}
	return u.events.Create(ctx, userID, in)
}

// Update enforces ownership (owner or admin) then applies validated changes.
func (u *EventUsecase) Update(ctx context.Context, actorID, actorRole, eventID string, in domain.EventInput) (*domain.Event, error) {
	if _, err := u.authorize(ctx, actorID, actorRole, eventID); err != nil {
		return nil, err
	}
	if err := u.validate(ctx, in); err != nil {
		return nil, err
	}
	return u.events.Update(ctx, eventID, in)
}

// Delete enforces ownership then removes the event. Events with sold tickets
// cannot be deleted because there is no refund flow.
func (u *EventUsecase) Delete(ctx context.Context, actorID, actorRole, eventID string) error {
	ev, err := u.authorize(ctx, actorID, actorRole, eventID)
	if err != nil {
		return err
	}
	if ev.Ticket != nil && ev.Ticket.QuantitySold > 0 {
		return domain.ErrEventHasSales
	}
	return u.events.Delete(ctx, eventID)
}

// authorize allows the event owner or an administrator only.
func (u *EventUsecase) authorize(ctx context.Context, actorID, actorRole, eventID string) (*domain.Event, error) {
	ev, err := u.events.FindByIDOrSlug(ctx, eventID, false)
	if err != nil {
		return nil, err
	}
	if actorRole != domain.RoleAdmin && ev.UserID != actorID {
		return nil, domain.ErrForbidden
	}
	return ev, nil
}

// validate applies the PRD event rules.
func (u *EventUsecase) validate(ctx context.Context, in domain.EventInput) error {
	if l := len(in.Title); l < 5 || l > 120 {
		return fmt.Errorf("%w: title must be 5–120 characters", domain.ErrInvalidInput)
	}
	if len(in.Description) > 5000 {
		return fmt.Errorf("%w: description must be at most 5000 characters", domain.ErrInvalidInput)
	}
	if in.Price < 0 {
		return fmt.Errorf("%w: price cannot be negative", domain.ErrInvalidInput)
	}
	if in.TicketQuantity < 1 {
		return fmt.Errorf("%w: total tickets must be at least 1", domain.ErrInvalidInput)
	}
	if len(in.Tags) > 10 {
		return fmt.Errorf("%w: an event can have at most 10 tags", domain.ErrInvalidInput)
	}
	if n := len(in.Images); n < 1 || n > 10 {
		return fmt.Errorf("%w: an event must have between 1 and 10 images", domain.ErrInvalidInput)
	}
	featured := 0
	for _, img := range in.Images {
		if img.IsFeatured {
			featured++
		}
	}
	if featured != 1 {
		return fmt.Errorf("%w: please select exactly one image as the event thumbnail", domain.ErrInvalidInput)
	}
	if in.EventDate.Before(startOfToday()) {
		return fmt.Errorf("%w: event date must be today or a future date", domain.ErrInvalidInput)
	}

	cat, err := u.categories.FindByID(ctx, in.CategoryID)
	if err != nil {
		return fmt.Errorf("%w: selected category does not exist", domain.ErrInvalidInput)
	}
	if !cat.IsActive {
		return fmt.Errorf("%w: selected category is not active", domain.ErrInvalidInput)
	}
	return nil
}

func startOfToday() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
}
