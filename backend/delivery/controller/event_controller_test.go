package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"local-event-backend/domain"

	"github.com/gorilla/mux"
)

func TestEventController_List(t *testing.T) {
	uc := &fakeEventUsecase{events: []domain.Event{{ID: "e1"}, {ID: "e2"}}, total: 2}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events?q=jazz&limit=10", nil)
	rec := httptest.NewRecorder()
	c.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d; want 200", rec.Code)
	}
	var resp struct {
		TotalCount int `json:"total_count"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.TotalCount != 2 {
		t.Errorf("total_count = %d; want 2", resp.TotalCount)
	}
}

func TestEventController_Get_Published(t *testing.T) {
	uc := &fakeEventUsecase{event: &domain.Event{ID: "e1", Status: domain.EventPublished}}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/e1", nil)
	req = mux.SetURLVars(req, map[string]string{"idOrSlug": "e1"})
	rec := httptest.NewRecorder()
	c.Get(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestEventController_Get_DraftHiddenFromPublic(t *testing.T) {
	uc := &fakeEventUsecase{event: &domain.Event{ID: "e1", UserID: "owner", Status: domain.EventDraft}}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/e1", nil)
	req = mux.SetURLVars(req, map[string]string{"idOrSlug": "e1"})
	rec := httptest.NewRecorder()
	c.Get(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d; want 404 for draft viewed by public", rec.Code)
	}
}

func TestEventController_Get_NotFound(t *testing.T) {
	uc := &fakeEventUsecase{err: domain.ErrNotFound}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/missing", nil)
	req = mux.SetURLVars(req, map[string]string{"idOrSlug": "missing"})
	rec := httptest.NewRecorder()
	c.Get(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d; want 404", rec.Code)
	}
}

func TestEventController_Create(t *testing.T) {
	uc := &fakeEventUsecase{event: &domain.Event{ID: "e1", Title: "New Event"}}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(`{"title":"New Event"}`))
	rec := httptest.NewRecorder()
	c.Create(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d; want 201", rec.Code)
	}
}

func TestEventController_Create_ValidationError(t *testing.T) {
	uc := &fakeEventUsecase{err: domain.ErrInvalidInput}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(`{"title":"x"}`))
	rec := httptest.NewRecorder()
	c.Create(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d; want 400", rec.Code)
	}
}

func TestEventController_Update(t *testing.T) {
	uc := &fakeEventUsecase{event: &domain.Event{ID: "e1", Title: "Updated"}}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodPut, "/api/events/e1", strings.NewReader(`{"title":"Updated"}`))
	req = mux.SetURLVars(req, map[string]string{"id": "e1"})
	rec := httptest.NewRecorder()
	c.Update(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestEventController_Update_Forbidden(t *testing.T) {
	uc := &fakeEventUsecase{err: domain.ErrForbidden}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodPut, "/api/events/e1", strings.NewReader(`{"title":"Updated"}`))
	req = mux.SetURLVars(req, map[string]string{"id": "e1"})
	rec := httptest.NewRecorder()
	c.Update(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("status = %d; want 403", rec.Code)
	}
}

func TestEventController_Delete(t *testing.T) {
	uc := &fakeEventUsecase{}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodDelete, "/api/events/e1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "e1"})
	rec := httptest.NewRecorder()
	c.Delete(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
	if !uc.deleted {
		t.Error("usecase Delete was not called")
	}
}

func TestEventController_Nearby(t *testing.T) {
	uc := &fakeEventUsecase{nearby: []domain.NearbyEvent{{EventID: "e1", DistanceKM: 2.5}}}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/nearby?lat=9&lng=38&radius=5", nil)
	rec := httptest.NewRecorder()
	c.Nearby(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestEventController_Mine(t *testing.T) {
	uc := &fakeEventUsecase{events: []domain.Event{{ID: "e1"}}, total: 1}
	c := NewEventController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/mine", nil)
	rec := httptest.NewRecorder()
	c.Mine(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}
