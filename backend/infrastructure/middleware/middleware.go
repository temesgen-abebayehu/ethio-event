package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"local-event-backend/domain"
)

type ctxKey string

const (
	ctxUserID ctxKey = "userID"
	ctxRole   ctxKey = "role"
)

// Middleware provides auth and CORS wrappers backed by the JWT secret.
type Middleware struct {
	jwtSecret string
}

// New builds middleware with the signing secret.
func New(jwtSecret string) *Middleware {
	return &Middleware{jwtSecret: jwtSecret}
}

// CORS allows the browser frontend to call the API.
func (m *Middleware) CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAuth rejects requests without a valid token.
func (m *Middleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := m.parse(r)
		if !ok {
			jsonError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		next(w, r.WithContext(withClaims(r.Context(), claims)))
	}
}

// RequireAdmin rejects requests that are not from an administrator.
func (m *Middleware) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return m.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if RoleFromContext(r.Context()) != domain.RoleAdmin {
			jsonError(w, http.StatusForbidden, "administrator access required")
			return
		}
		next(w, r)
	})
}

// RequireOrganizer rejects requests that are not from an organizer or admin.
func (m *Middleware) RequireOrganizer(next http.HandlerFunc) http.HandlerFunc {
	return m.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if role := RoleFromContext(r.Context()); role != domain.RoleOrganizer && role != domain.RoleAdmin {
			jsonError(w, http.StatusForbidden, "organizer access required")
			return
		}
		next(w, r)
	})
}

// OptionalAuth attaches claims when present but never rejects the request.
func (m *Middleware) OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if claims, ok := m.parse(r); ok {
			r = r.WithContext(withClaims(r.Context(), claims))
		}
		next(w, r)
	}
}

// parse extracts and validates the bearer token from the request.
func (m *Middleware) parse(r *http.Request) (*Claims, bool) {
	header := r.Header.Get("Authorization")
	token := strings.TrimPrefix(header, "Bearer ")
	if token == "" || token == header {
		return nil, false
	}
	claims, err := ParseJWT(token, m.jwtSecret)
	if err != nil {
		return nil, false
	}
	return claims, true
}

func withClaims(ctx context.Context, c *Claims) context.Context {
	ctx = context.WithValue(ctx, ctxUserID, c.UserID)
	return context.WithValue(ctx, ctxRole, c.Role)
}

// UserIDFromContext returns the authenticated user ID, or "" if unauthenticated.
func UserIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(ctxUserID).(string)
	return id
}

// RoleFromContext returns the authenticated user's role, or "" if unauthenticated.
func RoleFromContext(ctx context.Context) string {
	role, _ := ctx.Value(ctxRole).(string)
	return role
}

func jsonError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
