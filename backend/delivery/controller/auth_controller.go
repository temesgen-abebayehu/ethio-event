package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"
)

// AuthController exposes authentication endpoints.
type AuthController struct {
	auth domain.AuthUsecase
}

// NewAuthController builds an AuthController.
func NewAuthController(auth domain.AuthUsecase) *AuthController {
	return &AuthController{auth: auth}
}

// Signup handles POST /api/auth/signup.
func (c *AuthController) Signup(w http.ResponseWriter, r *http.Request) {
	var req dto.SignupRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	res, err := c.auth.Signup(r.Context(), req.Email, req.Password, req.FullName, req.Role)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, dto.AuthResponse{AccessToken: res.Token, User: dto.NewUserResponse(res.User)})
}

// Login handles POST /api/auth/login.
func (c *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	res, err := c.auth.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.AuthResponse{AccessToken: res.Token, User: dto.NewUserResponse(res.User)})
}

// Me handles GET /api/auth/me.
func (c *AuthController) Me(w http.ResponseWriter, r *http.Request) {
	user, err := c.auth.Me(r.Context(), middleware.UserIDFromContext(r.Context()))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewUserResponse(user))
}

// UpdateProfile handles PUT /api/auth/me.
func (c *AuthController) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req dto.UpdateProfileRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	user, err := c.auth.UpdateProfile(r.Context(), middleware.UserIDFromContext(r.Context()), req.FullName, req.Phone, req.City, req.AvatarURL)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewUserResponse(user))
}

// ChangePassword handles POST /api/auth/change-password.
func (c *AuthController) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ChangePasswordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := c.auth.ChangePassword(r.Context(), middleware.UserIDFromContext(r.Context()), req.CurrentPassword, req.NewPassword); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "password updated"})
}

// ForgotPassword handles POST /api/auth/forgot-password.
func (c *AuthController) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ForgotPasswordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := c.auth.ForgotPassword(r.Context(), req.Email); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "if the email exists, a reset link has been sent"})
}

// ResetPassword handles POST /api/auth/reset-password.
func (c *AuthController) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ResetPasswordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := c.auth.ResetPassword(r.Context(), req.Token, req.NewPassword); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "password updated"})
}
