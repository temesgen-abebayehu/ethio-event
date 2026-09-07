package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"
)

// UploadController exposes image upload endpoints.
type UploadController struct {
	upload domain.UploadUsecase
}

// NewUploadController builds an UploadController.
func NewUploadController(upload domain.UploadUsecase) *UploadController {
	return &UploadController{upload: upload}
}

// Upload handles POST /api/upload (multipart form: files[], event_id).
func (c *UploadController) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse upload form")
		return
	}
	eventID := r.FormValue("event_id")
	if eventID == "" {
		eventID = "new" // images uploaded before the event is created
	}
	files := r.MultipartForm.File["files"]

	uploaded, err := c.upload.UploadFiles(files, middleware.UserIDFromContext(r.Context()), eventID)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewUploadResponse(uploaded))
}

// Delete handles DELETE /api/upload.
func (c *UploadController) Delete(w http.ResponseWriter, r *http.Request) {
	var req dto.DeleteFilesRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := c.upload.DeleteFiles(req.PublicIDs); err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "files deleted"})
}
