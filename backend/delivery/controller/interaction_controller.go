package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"

	"github.com/gorilla/mux"
)

// InteractionController exposes bookmark and follow endpoints.
type InteractionController struct {
	interactions domain.InteractionUsecase
}

// NewInteractionController builds an InteractionController.
func NewInteractionController(interactions domain.InteractionUsecase) *InteractionController {
	return &InteractionController{interactions: interactions}
}

// Bookmark handles POST /api/events/{id}/bookmark.
func (c *InteractionController) Bookmark(w http.ResponseWriter, r *http.Request) {
	if err := c.interactions.Bookmark(r.Context(), middleware.UserIDFromContext(r.Context()), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "bookmarked"})
}

// RemoveBookmark handles DELETE /api/events/{id}/bookmark.
func (c *InteractionController) RemoveBookmark(w http.ResponseWriter, r *http.Request) {
	if err := c.interactions.RemoveBookmark(r.Context(), middleware.UserIDFromContext(r.Context()), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "bookmark removed"})
}

// Follow handles POST /api/events/{id}/follow.
func (c *InteractionController) Follow(w http.ResponseWriter, r *http.Request) {
	if err := c.interactions.Follow(r.Context(), middleware.UserIDFromContext(r.Context()), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "following"})
}

// Unfollow handles DELETE /api/events/{id}/follow.
func (c *InteractionController) Unfollow(w http.ResponseWriter, r *http.Request) {
	if err := c.interactions.Unfollow(r.Context(), middleware.UserIDFromContext(r.Context()), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "unfollowed"})
}

// Status handles GET /api/events/{id}/interactions.
func (c *InteractionController) Status(w http.ResponseWriter, r *http.Request) {
	bookmarked, following, err := c.interactions.Status(r.Context(), middleware.UserIDFromContext(r.Context()), mux.Vars(r)["id"])
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.InteractionStatusResponse{Bookmarked: bookmarked, Following: following})
}

// Bookmarks handles GET /api/me/bookmarks.
func (c *InteractionController) Bookmarks(w http.ResponseWriter, r *http.Request) {
	events, err := c.interactions.Bookmarks(r.Context(), middleware.UserIDFromContext(r.Context()))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventListResponse(events, len(events)))
}

// Follows handles GET /api/me/follows.
func (c *InteractionController) Follows(w http.ResponseWriter, r *http.Request) {
	events, err := c.interactions.Follows(r.Context(), middleware.UserIDFromContext(r.Context()))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventListResponse(events, len(events)))
}
