package controller

import (
	"net/http"
	"strconv"
	"time"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"

	"github.com/gorilla/mux"
)

// EventController exposes event discovery and management endpoints.
type EventController struct {
	events domain.EventUsecase
}

// NewEventController builds an EventController.
func NewEventController(events domain.EventUsecase) *EventController {
	return &EventController{events: events}
}

// List handles GET /api/events (public discovery).
func (c *EventController) List(w http.ResponseWriter, r *http.Request) {
	f := parseEventFilter(r)
	f.PublicOnly = true
	events, total, err := c.events.List(r.Context(), f)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventListResponse(events, total))
}

// Mine handles GET /api/events/mine (organizer's own events, drafts included).
func (c *EventController) Mine(w http.ResponseWriter, r *http.Request) {
	events, total, err := c.events.ListByOrganizer(r.Context(), middleware.UserIDFromContext(r.Context()))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventListResponse(events, total))
}

// Nearby handles GET /api/events/nearby?lat=&lng=&radius=.
func (c *EventController) Nearby(w http.ResponseWriter, r *http.Request) {
	lat, _ := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lng, _ := strconv.ParseFloat(r.URL.Query().Get("lng"), 64)
	radius, _ := strconv.ParseFloat(r.URL.Query().Get("radius"), 64)
	if radius <= 0 {
		radius = 10
	}
	results, err := c.events.Nearby(r.Context(), lat, lng, radius)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	out := make([]map[string]interface{}, 0, len(results))
	for _, n := range results {
		out = append(out, map[string]interface{}{"event_id": n.EventID, "distance_km": n.DistanceKM})
	}
	writeJSON(w, http.StatusOK, out)
}

// Get handles GET /api/events/{idOrSlug}. Drafts are visible only to owner/admin.
func (c *EventController) Get(w http.ResponseWriter, r *http.Request) {
	event, err := c.events.Get(r.Context(), mux.Vars(r)["idOrSlug"], false)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	if event.Status != domain.EventPublished {
		uid := middleware.UserIDFromContext(r.Context())
		if middleware.RoleFromContext(r.Context()) != domain.RoleAdmin && event.UserID != uid {
			writeError(w, http.StatusNotFound, "event not found or no longer available")
			return
		}
	}
	writeJSON(w, http.StatusOK, dto.NewEventResponse(*event))
}

// Create handles POST /api/events.
func (c *EventController) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.EventRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	event, err := c.events.Create(r.Context(), middleware.UserIDFromContext(r.Context()), req.ToInput())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, dto.NewEventResponse(*event))
}

// Update handles PUT /api/events/{id}.
func (c *EventController) Update(w http.ResponseWriter, r *http.Request) {
	var req dto.EventRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	event, err := c.events.Update(ctx, middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx), mux.Vars(r)["id"], req.ToInput())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventResponse(*event))
}

// Delete handles DELETE /api/events/{id}.
func (c *EventController) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if err := c.events.Delete(ctx, middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "event deleted"})
}

// parseEventFilter reads list/search query parameters.
func parseEventFilter(r *http.Request) domain.EventFilter {
	q := r.URL.Query()
	f := domain.EventFilter{
		Search:     q.Get("q"),
		CategoryID: q.Get("category_id"),
		FreeOnly:   q.Get("free") == "true",
		Sort:       q.Get("sort"),
		Order:      q.Get("order"),
	}
	if v := q.Get("min_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MinPrice = &p
		}
	}
	if v := q.Get("max_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MaxPrice = &p
		}
	}
	if t, ok := parseDate(q.Get("date_from"), false); ok {
		f.DateFrom = &t
	}
	if t, ok := parseDate(q.Get("date_to"), true); ok {
		f.DateTo = &t
	}
	if v, err := strconv.Atoi(q.Get("limit")); err == nil && v > 0 {
		f.Limit = v
	}
	if v, err := strconv.Atoi(q.Get("offset")); err == nil && v >= 0 {
		f.Offset = v
	}
	return f
}

// parseDate accepts RFC3339 or YYYY-MM-DD; endOfDay extends date-only to 23:59:59.
func parseDate(s string, endOfDay bool) (time.Time, bool) {
	if s == "" {
		return time.Time{}, false
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, true
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		if endOfDay {
			t = t.Add(24*time.Hour - time.Second)
		}
		return t, true
	}
	return time.Time{}, false
}
