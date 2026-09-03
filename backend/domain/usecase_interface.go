package domain

import (
	"context"
	"mime/multipart"
)

// This file groups every usecase (application) interface implemented by the
// usecase layer and consumed by the delivery/controller layer.

// AuthResult is the outcome of a successful signup or login.
type AuthResult struct {
	Token string
	User  *User
}

// InitiateResult is returned when a ticket purchase is started.
type InitiateResult struct {
	CheckoutURL string
	TxRef       string
	TotalPrice  float64
	OrderID     string
	Status      string
}

// UploadedFile is a stored image reference returned to the caller.
type UploadedFile struct {
	URL      string
	PublicID string
}

// AuthUsecase covers registration, login and password recovery.
type AuthUsecase interface {
	Signup(ctx context.Context, email, password, fullName, role string) (*AuthResult, error)
	Login(ctx context.Context, email, password string) (*AuthResult, error)
	Me(ctx context.Context, userID string) (*User, error)
	UpdateProfile(ctx context.Context, userID, fullName, phone, city, avatarURL string) (*User, error)
	ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
}

// EventUsecase covers event discovery and management.
type EventUsecase interface {
	List(ctx context.Context, f EventFilter) ([]Event, int, error)
	ListByOrganizer(ctx context.Context, userID string) ([]Event, int, error)
	Get(ctx context.Context, idOrSlug string, publicOnly bool) (*Event, error)
	Nearby(ctx context.Context, lat, lng, radiusKM float64) ([]NearbyEvent, error)
	Create(ctx context.Context, userID string, in EventInput) (*Event, error)
	Update(ctx context.Context, actorID, actorRole, eventID string, in EventInput) (*Event, error)
	Delete(ctx context.Context, actorID, actorRole, eventID string) error
}

// CategoryUsecase covers admin-managed category CRUD.
type CategoryUsecase interface {
	List(ctx context.Context, activeOnly bool) ([]Category, error)
	Create(ctx context.Context, c *Category) (*Category, error)
	Update(ctx context.Context, c *Category) (*Category, error)
	Delete(ctx context.Context, id string) error
	SetActive(ctx context.Context, id string, active bool) error
}

// TagUsecase covers tag listing.
type TagUsecase interface {
	List(ctx context.Context) ([]Tag, error)
}

// InteractionUsecase covers bookmark and follow actions.
type InteractionUsecase interface {
	Bookmark(ctx context.Context, userID, eventID string) error
	RemoveBookmark(ctx context.Context, userID, eventID string) error
	Follow(ctx context.Context, userID, eventID string) error
	Unfollow(ctx context.Context, userID, eventID string) error
	Status(ctx context.Context, userID, eventID string) (bookmarked, following bool, err error)
	Bookmarks(ctx context.Context, userID string) ([]Event, error)
	Follows(ctx context.Context, userID string) ([]Event, error)
}

// PaymentUsecase covers the buy-tickets flow.
type PaymentUsecase interface {
	Initiate(ctx context.Context, userID, eventID string, quantity int) (*InitiateResult, error)
	Verify(ctx context.Context, txRef string) (*Order, error)
	HandleCallback(ctx context.Context, txRef, gatewayStatus string) error
	MyTickets(ctx context.Context, userID string) ([]Order, error)
	EventBuyers(ctx context.Context, actorID, actorRole, eventID string) ([]EventBuyer, error)
	ScanTicket(ctx context.Context, actorID, actorRole, code string) (*ScanResult, error)
	NotifyBuyers(ctx context.Context, actorID, actorRole, eventID string, recipients []string, subject, body string) (int, error)
}

// UploadUsecase covers event image uploads.
type UploadUsecase interface {
	UploadFiles(files []*multipart.FileHeader, userID, eventID string) ([]UploadedFile, error)
	DeleteFiles(publicIDs []string) error
}

// AnalyticsUsecase exposes platform-wide admin metrics.
type AnalyticsUsecase interface {
	Get(ctx context.Context) (*Analytics, error)
}
