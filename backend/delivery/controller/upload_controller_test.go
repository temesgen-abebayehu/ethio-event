package controller

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"local-event-backend/domain"
)

func TestUploadController_Upload(t *testing.T) {
	uc := &fakeUploadUsecase{files: []domain.UploadedFile{{URL: "https://cdn/img.jpg", PublicID: "pid"}}}
	c := NewUploadController(uc)

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("event_id", "event-1")
	fw, _ := w.CreateFormFile("files", "a.jpg")
	_, _ = fw.Write([]byte("image-bytes"))
	_ = w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	c.Upload(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestUploadController_Upload_BadForm(t *testing.T) {
	c := NewUploadController(&fakeUploadUsecase{})
	req := httptest.NewRequest(http.MethodPost, "/api/upload", strings.NewReader("not-multipart"))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=nope")
	rec := httptest.NewRecorder()
	c.Upload(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d; want 400", rec.Code)
	}
}

func TestUploadController_Delete(t *testing.T) {
	c := NewUploadController(&fakeUploadUsecase{})
	req := httptest.NewRequest(http.MethodDelete, "/api/upload", strings.NewReader(`{"public_ids":["a","b"]}`))
	rec := httptest.NewRecorder()
	c.Delete(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}
