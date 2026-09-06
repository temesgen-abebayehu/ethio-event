package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"local-event-backend/domain"

	"github.com/gorilla/mux"
)

func TestInteractionController_ToggleActions(t *testing.T) {
	c := NewInteractionController(&fakeInteractionUsecase{})

	actions := []struct {
		name   string
		method string
		fn     func(http.ResponseWriter, *http.Request)
	}{
		{"bookmark", http.MethodPost, c.Bookmark},
		{"remove bookmark", http.MethodDelete, c.RemoveBookmark},
		{"follow", http.MethodPost, c.Follow},
		{"unfollow", http.MethodDelete, c.Unfollow},
	}
	for _, a := range actions {
		t.Run(a.name, func(t *testing.T) {
			req := httptest.NewRequest(a.method, "/api/events/e1/x", nil)
			req = mux.SetURLVars(req, map[string]string{"id": "e1"})
			rec := httptest.NewRecorder()
			a.fn(rec, req)
			if rec.Code != http.StatusOK {
				t.Errorf("status = %d; want 200", rec.Code)
			}
		})
	}
}

func TestInteractionController_Status(t *testing.T) {
	uc := &fakeInteractionUsecase{bookmarked: true, following: true}
	c := NewInteractionController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/events/e1/interactions", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "e1"})
	rec := httptest.NewRecorder()
	c.Status(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d; want 200", rec.Code)
	}
	var resp struct {
		Bookmarked bool `json:"bookmarked"`
		Following  bool `json:"following"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if !resp.Bookmarked || !resp.Following {
		t.Errorf("resp = %+v; want both true", resp)
	}
}

func TestInteractionController_Lists(t *testing.T) {
	uc := &fakeInteractionUsecase{events: []domain.Event{{ID: "e1"}}}
	c := NewInteractionController(uc)

	for _, fn := range []func(http.ResponseWriter, *http.Request){c.Bookmarks, c.Follows} {
		req := httptest.NewRequest(http.MethodGet, "/api/me/x", nil)
		rec := httptest.NewRecorder()
		fn(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("status = %d; want 200", rec.Code)
		}
	}
}
