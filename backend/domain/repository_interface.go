package domain

import (
	"context"
	"time"
)

// This file groups every repository (persistence) interface implemented by the
// repository layer and consumed by the usecase layer.

// UserRepository is the persistence contract for users.
type UserRepository interface {
	Create(ctx context.Context, u *User) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	UpdatePassword(ctx context.Context, userID, passwordHash string) error
	UpdateProfile(ctx context.Context, userID, fullName string, phone, city, avatarURL *string) (*User, error)
}

// PasswordResetRepository is the persistence contract for reset tokens.
type PasswordResetRepository interface {
	Create(ctx context.Context, pr *PasswordReset) error
	FindValidByHash(ctx context.Context, tokenHash string) (*PasswordReset, error)
	MarkUsed(ctx context.Context, id string) error
}

// CategoryRepository is the persistence contract for categories.
type CategoryRepository interface {
	List(ctx context.Context, activeOnly bool) ([]Category, error)
	FindByID(ctx context.Context, id string) (*Category, error)
	Create(ctx context.Context, c *Category) (*Category, error)
	Update(ctx context.Context, c *Category) (*Category, error)
	Delete(ctx context.Context, id string) error
	SetActive(ctx context.Context, id string, active bool) error
	CountEvents(ctx context.Context, id string) (int, error)
}

// TagRepository is the persistence contract for tags.
type TagRepository interface {
	List(ctx context.Context) ([]Tag, error)
}

// EventRepository is the persistence contract for events.
type EventRepository interface {
	List(ctx context.Context, f EventFilter) ([]Event, int, error)
	FindByIDOrSlug(ctx context.Context, idOrSlug string, publicOnly bool) (*Event, error)
	Create(ctx context.Context, userID string, in EventInput) (*Event, error)
	Update(ctx context.Context, id string, in EventInput) (*Event, error)
	Delete(ctx context.Context, id string) error
	Nearby(ctx context.Context, lat, lng, radiusKM float64) ([]NearbyEvent, error)
}

// TicketRepository is the persistence contract for tickets.
type TicketRepository interface {
	FindByEventID(ctx context.Context, eventID string) (*Ticket, error)
}

// OrderRepository is the persistence contract for orders.
type OrderRepository interface {
	Create(ctx context.Context, o *Order) (*Order, error)
	UpdateStatus(ctx context.Context, txRef, status string) error
	FindByTxRef(ctx context.Context, txRef string) (*Order, error)
	ListByUser(ctx context.Context, userID string) ([]Order, error)
	ListEventBuyers(ctx context.Context, eventID string) ([]EventBuyer, error)
	FindActiveByUserAndTicket(ctx context.Context, userID, ticketID string) (*Order, error)
	FindTicketScanInfo(ctx context.Context, orderID string) (*TicketScanInfo, error)
	MarkScanned(ctx context.Context, orderID, scannerID string) (time.Time, error)
}

// InteractionRepository handles bookmarks and follows (user↔event links).
type InteractionRepository interface {
	AddBookmark(ctx context.Context, userID, eventID string) error
	RemoveBookmark(ctx context.Context, userID, eventID string) error
	AddFollow(ctx context.Context, userID, eventID string) error
	RemoveFollow(ctx context.Context, userID, eventID string) error
	Status(ctx context.Context, userID, eventID string) (bookmarked, following bool, err error)
	ListBookmarkedEvents(ctx context.Context, userID string) ([]Event, error)
	ListFollowedEvents(ctx context.Context, userID string) ([]Event, error)
}

// AnalyticsRepository provides platform-wide aggregated metrics.
type AnalyticsRepository interface {
	Get(ctx context.Context) (*Analytics, error)
}
