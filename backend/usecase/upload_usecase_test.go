package usecase

import (
	"bytes"
	"errors"
	"mime/multipart"
	"testing"

	"local-event-backend/domain"
)

// buildFileHeaders creates in-memory multipart file headers for the given names.
func buildFileHeaders(t *testing.T, names ...string) []*multipart.FileHeader {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	for _, name := range names {
		fw, err := w.CreateFormFile("files", name)
		if err != nil {
			t.Fatalf("CreateFormFile: %v", err)
		}
		_, _ = fw.Write([]byte("fake-image-bytes"))
	}
	_ = w.Close()

	form, err := multipart.NewReader(&buf, w.Boundary()).ReadForm(1 << 20)
	if err != nil {
		t.Fatalf("ReadForm: %v", err)
	}
	return form.File["files"]
}

func TestUploadUsecase_UploadFiles_Success(t *testing.T) {
	store := &fakeFileStore{}
	uc := NewUploadUsecase(store)

	files := buildFileHeaders(t, "a.jpg", "b.png")
	out, err := uc.UploadFiles(files, "user-1", "event-1")
	if err != nil {
		t.Fatalf("UploadFiles error = %v", err)
	}
	if len(out) != 2 {
		t.Errorf("uploaded %d files; want 2", len(out))
	}
	if store.uploads != 2 {
		t.Errorf("store.uploads = %d; want 2", store.uploads)
	}
}

func TestUploadUsecase_UploadFiles_Validation(t *testing.T) {
	uc := NewUploadUsecase(&fakeFileStore{})

	t.Run("no files", func(t *testing.T) {
		if _, err := uc.UploadFiles(nil, "u", "e"); !errors.Is(err, domain.ErrInvalidInput) {
			t.Errorf("error = %v; want ErrInvalidInput", err)
		}
	})

	t.Run("too many files", func(t *testing.T) {
		names := make([]string, 11)
		for i := range names {
			names[i] = "f.jpg"
		}
		files := buildFileHeaders(t, names...)
		if _, err := uc.UploadFiles(files, "u", "e"); !errors.Is(err, domain.ErrInvalidInput) {
			t.Errorf("error = %v; want ErrInvalidInput", err)
		}
	})

	t.Run("bad extension", func(t *testing.T) {
		files := buildFileHeaders(t, "malware.gif")
		if _, err := uc.UploadFiles(files, "u", "e"); !errors.Is(err, domain.ErrInvalidInput) {
			t.Errorf("error = %v; want ErrInvalidInput", err)
		}
	})
}

func TestUploadUsecase_DeleteFiles(t *testing.T) {
	store := &fakeFileStore{}
	uc := NewUploadUsecase(store)

	if err := uc.DeleteFiles([]string{"a", "b"}); err != nil {
		t.Fatalf("DeleteFiles error = %v", err)
	}
	if len(store.deleted) != 2 {
		t.Errorf("deleted %d; want 2", len(store.deleted))
	}

	if err := uc.DeleteFiles(nil); !errors.Is(err, domain.ErrInvalidInput) {
		t.Errorf("DeleteFiles(nil) error = %v; want ErrInvalidInput", err)
	}
}
