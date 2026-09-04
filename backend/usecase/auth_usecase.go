package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"
)

// AuthUsecase implements account registration, login and password recovery.
type AuthUsecase struct {
	users     domain.UserRepository
	resets    domain.PasswordResetRepository
	mailer    domain.Mailer
	jwtSecret string
	resetBase string // frontend URL used to build reset links
}

// NewAuthUsecase wires the auth usecase.
func NewAuthUsecase(users domain.UserRepository, resets domain.PasswordResetRepository, mailer domain.Mailer, jwtSecret, resetBase string) *AuthUsecase {
	return &AuthUsecase{users: users, resets: resets, mailer: mailer, jwtSecret: jwtSecret, resetBase: resetBase}
}

// Signup validates input, creates the account and returns an auth token.
func (u *AuthUsecase) Signup(ctx context.Context, email, password, fullName, role string) (*domain.AuthResult, error) {
	if l := len(fullName); l < 2 || l > 100 {
		return nil, fmt.Errorf("%w: full name must be 2–100 characters", domain.ErrInvalidInput)
	}
	if !middleware.ValidEmail(email) {
		return nil, fmt.Errorf("%w: please enter a valid email address", domain.ErrInvalidInput)
	}
	if !middleware.StrongPassword(password) {
		return nil, fmt.Errorf("%w: password must be at least 8 characters and include a letter and a number", domain.ErrInvalidInput)
	}

	// Public signup may only self-assign the user or organizer role.
	if role == "" {
		role = domain.RoleUser
	}
	if role != domain.RoleUser && role != domain.RoleOrganizer {
		return nil, fmt.Errorf("%w: role must be user or organizer", domain.ErrInvalidInput)
	}

	hash, err := middleware.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user, err := u.users.Create(ctx, &domain.User{
		Email:        email,
		PasswordHash: hash,
		FullName:     fullName,
		Role:         role,
	})
	if err != nil {
		return nil, err
	}
	return u.issue(user)
}

// Login verifies credentials and returns an auth token.
func (u *AuthUsecase) Login(ctx context.Context, email, password string) (*domain.AuthResult, error) {
	user, err := u.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidLogin // do not reveal which field was wrong
	}
	if !middleware.CheckPassword(password, user.PasswordHash) {
		return nil, domain.ErrInvalidLogin
	}
	return u.issue(user)
}

// Me returns the authenticated user's profile.
func (u *AuthUsecase) Me(ctx context.Context, userID string) (*domain.User, error) {
	return u.users.FindByID(ctx, userID)
}

// UpdateProfile updates the user's editable fields and returns the fresh profile.
func (u *AuthUsecase) UpdateProfile(ctx context.Context, userID, fullName, phone, city, avatarURL string) (*domain.User, error) {
	if l := len(fullName); l < 2 || l > 100 {
		return nil, fmt.Errorf("%w: full name must be 2–100 characters", domain.ErrInvalidInput)
	}
	return u.users.UpdateProfile(ctx, userID, fullName, optional(phone), optional(city), optional(avatarURL))
}

// ChangePassword verifies the current password before setting a new one.
func (u *AuthUsecase) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := u.users.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	if !middleware.CheckPassword(currentPassword, user.PasswordHash) {
		return fmt.Errorf("%w: current password is incorrect", domain.ErrInvalidInput)
	}
	if !middleware.StrongPassword(newPassword) {
		return fmt.Errorf("%w: password must be at least 8 characters and include a letter and a number", domain.ErrInvalidInput)
	}
	hash, err := middleware.HashPassword(newPassword)
	if err != nil {
		return err
	}
	return u.users.UpdatePassword(ctx, userID, hash)
}

// optional returns nil for empty strings so blank fields clear the column.
func optional(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

// ForgotPassword issues a time-limited reset token and emails the reset link.
// It never reveals whether the email exists.
func (u *AuthUsecase) ForgotPassword(ctx context.Context, email string) error {
	user, err := u.users.FindByEmail(ctx, email)
	if err != nil {
		return nil // silently succeed for unknown emails
	}

	token, err := middleware.RandomToken(32)
	if err != nil {
		return err
	}
	reset := &domain.PasswordReset{
		UserID:    user.ID,
		TokenHash: middleware.HashToken(token),
		ExpiresAt: time.Now().Add(time.Hour),
	}
	if err := u.resets.Create(ctx, reset); err != nil {
		return err
	}

	link := fmt.Sprintf("%s/auth/reset-password?token=%s", u.resetBase, token)
	return u.mailer.SendPasswordReset(user.Email, link)
}

// ResetPassword consumes a valid token and sets a new password.
func (u *AuthUsecase) ResetPassword(ctx context.Context, token, newPassword string) error {
	if !middleware.StrongPassword(newPassword) {
		return fmt.Errorf("%w: password must be at least 8 characters and include a letter and a number", domain.ErrInvalidInput)
	}
	reset, err := u.resets.FindValidByHash(ctx, middleware.HashToken(token))
	if err != nil {
		return fmt.Errorf("%w: reset link is invalid or expired", domain.ErrInvalidInput)
	}
	hash, err := middleware.HashPassword(newPassword)
	if err != nil {
		return err
	}
	if err := u.users.UpdatePassword(ctx, reset.UserID, hash); err != nil {
		return err
	}
	return u.resets.MarkUsed(ctx, reset.ID)
}

// issue builds a JWT for a user.
func (u *AuthUsecase) issue(user *domain.User) (*domain.AuthResult, error) {
	token, err := middleware.GenerateJWT(user.ID, user.Email, user.Role, u.jwtSecret)
	if err != nil {
		return nil, err
	}
	return &domain.AuthResult{Token: token, User: user}, nil
}
