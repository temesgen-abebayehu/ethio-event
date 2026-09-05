package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"local-event-backend/domain"
)

func TestTagController_List(t *testing.T) {
	uc := &fakeTagUsecase{tags: []domain.Tag{{ID: "1", Name: "jazz"}}}
	c := NewTagController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/tags", nil)
	rec := httptest.NewRecorder()
	c.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestTagController_List_Error(t *testing.T) {
	uc := &fakeTagUsecase{err: domain.ErrNotFound}
	c := NewTagController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/tags", nil)
	rec := httptest.NewRecorder()
	c.List(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d; want 404", rec.Code)
	}
}
