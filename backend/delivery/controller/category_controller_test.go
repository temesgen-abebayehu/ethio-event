package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"local-event-backend/domain"

	"github.com/gorilla/mux"
)

func TestCategoryController_List(t *testing.T) {
	uc := &fakeCategoryUsecase{categories: []domain.Category{{ID: "c1", Name: "Music"}}}
	c := NewCategoryController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/categories", nil)
	rec := httptest.NewRecorder()
	c.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestCategoryController_Create(t *testing.T) {
	uc := &fakeCategoryUsecase{category: &domain.Category{ID: "c1", Name: "Music"}}
	c := NewCategoryController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/categories", strings.NewReader(`{"name":"Music"}`))
	rec := httptest.NewRecorder()
	c.Create(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d; want 201", rec.Code)
	}
}

func TestCategoryController_Update(t *testing.T) {
	uc := &fakeCategoryUsecase{category: &domain.Category{ID: "c1", Name: "Music"}}
	c := NewCategoryController(uc)

	req := httptest.NewRequest(http.MethodPut, "/api/admin/categories/c1", strings.NewReader(`{"name":"Music"}`))
	req = mux.SetURLVars(req, map[string]string{"id": "c1"})
	rec := httptest.NewRecorder()
	c.Update(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestCategoryController_Delete_InUse(t *testing.T) {
	uc := &fakeCategoryUsecase{err: domain.ErrCategoryInUse}
	c := NewCategoryController(uc)

	req := httptest.NewRequest(http.MethodDelete, "/api/admin/categories/c1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "c1"})
	rec := httptest.NewRecorder()
	c.Delete(rec, req)

	if rec.Code != http.StatusConflict {
		t.Errorf("status = %d; want 409", rec.Code)
	}
}

func TestCategoryController_SetActive(t *testing.T) {
	uc := &fakeCategoryUsecase{}
	c := NewCategoryController(uc)

	req := httptest.NewRequest(http.MethodPatch, "/api/admin/categories/c1/active", strings.NewReader(`{"is_active":false}`))
	req = mux.SetURLVars(req, map[string]string{"id": "c1"})
	rec := httptest.NewRecorder()
	c.SetActive(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}
