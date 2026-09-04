// Package dto holds the controller-facing request and response structures. It
// keeps JSON wire formats separate from domain entities and maps between them.
package dto

import "local-event-backend/domain"

// SignupRequest is the body for POST /api/auth/signup.
type SignupRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// LoginRequest is the body for POST /api/auth/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ForgotPasswordRequest is the body for POST /api/auth/forgot-password.
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest is the body for POST /api/auth/reset-password.
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// UserResponse is the public representation of a user.
type UserResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	FullName  string  `json:"full_name"`
	Phone     *string `json:"phone,omitempty"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	City      *string `json:"city,omitempty"`
	Role      string  `json:"role"`
	CreatedAt string  `json:"created_at"`
}

// AuthResponse is returned on successful signup/login.
type AuthResponse struct {
	AccessToken string       `json:"access_token"`
	User        UserResponse `json:"user"`
}

// NewUserResponse maps a domain user to its response DTO.
func NewUserResponse(u *domain.User) UserResponse {
	return UserResponse{
		ID: u.ID, Email: u.Email, FullName: u.FullName,
		Phone: u.Phone, AvatarURL: u.AvatarURL, City: u.City, Role: u.Role,
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// UpdateProfileRequest is the body for PUT /api/auth/me.
type UpdateProfileRequest struct {
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	City      string `json:"city"`
	AvatarURL string `json:"avatar_url"`
}

// ChangePasswordRequest is the body for POST /api/auth/change-password.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}
