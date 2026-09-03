package domain

import "time"

// User roles.
const (
	RoleUser      = "user"
	RoleOrganizer = "organizer"
	RoleAdmin     = "admin"
)

// User is the core account entity.
type User struct {
	ID           string
	Email        string
	PasswordHash string
	FullName     string
	Phone        *string
	AvatarURL    *string
	City         *string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// PasswordReset is a time-limited, single-use token for resetting a password.
type PasswordReset struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
}
