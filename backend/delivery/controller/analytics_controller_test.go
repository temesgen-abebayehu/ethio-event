package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"local-event-backend/domain"
)

func TestAnalyticsController_Get(t *testing.T) {
	uc := &fakeAnalyticsUsecase{analytics: &domain.Analytics{TotalUsers: 3, TotalTicketsSold: 7}}
	c := NewAnalyticsController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/analytics", nil)
	rec := httptest.NewRecorder()
	c.Get(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	Health(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}
