package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
)

// TagController exposes tag listing.
type TagController struct {
	tags domain.TagUsecase
}

// NewTagController builds a TagController.
func NewTagController(tags domain.TagUsecase) *TagController {
	return &TagController{tags: tags}
}

// List handles GET /api/tags.
func (c *TagController) List(w http.ResponseWriter, r *http.Request) {
	tags, err := c.tags.List(r.Context())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewTagList(tags))
}
