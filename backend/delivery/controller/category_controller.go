package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"

	"github.com/gorilla/mux"
)

// CategoryController exposes category listing and admin CRUD.
type CategoryController struct {
	categories domain.CategoryUsecase
}

// NewCategoryController builds a CategoryController.
func NewCategoryController(categories domain.CategoryUsecase) *CategoryController {
	return &CategoryController{categories: categories}
}

// List handles GET /api/categories (public, active categories only).
func (c *CategoryController) List(w http.ResponseWriter, r *http.Request) {
	cats, err := c.categories.List(r.Context(), true)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewCategoryList(cats))
}

// ListAll handles GET /api/admin/categories (admin, includes inactive + counts).
func (c *CategoryController) ListAll(w http.ResponseWriter, r *http.Request) {
	cats, err := c.categories.List(r.Context(), false)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewCategoryList(cats))
}

// Create handles POST /api/admin/categories.
func (c *CategoryController) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CategoryRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	cat := req.ToDomain()
	created, err := c.categories.Create(r.Context(), &cat)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, dto.NewCategoryResponse(*created))
}

// Update handles PUT /api/admin/categories/{id}.
func (c *CategoryController) Update(w http.ResponseWriter, r *http.Request) {
	var req dto.CategoryRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	cat := req.ToDomain()
	cat.ID = mux.Vars(r)["id"]
	updated, err := c.categories.Update(r.Context(), &cat)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewCategoryResponse(*updated))
}

// Delete handles DELETE /api/admin/categories/{id}.
func (c *CategoryController) Delete(w http.ResponseWriter, r *http.Request) {
	if err := c.categories.Delete(r.Context(), mux.Vars(r)["id"]); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "category deleted"})
}

// SetActive handles PATCH /api/admin/categories/{id}/active.
func (c *CategoryController) SetActive(w http.ResponseWriter, r *http.Request) {
	var req dto.SetActiveRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := c.categories.SetActive(r.Context(), mux.Vars(r)["id"], req.IsActive); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "category updated"})
}
