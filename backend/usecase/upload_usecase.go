package usecase

import (
	"fmt"
	"mime/multipart"
	"strings"

	"local-event-backend/domain"
)

const (
	maxImageBytes = 10 << 20 // 10MB per PRD
	maxImageCount = 10
)

var allowedImageExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}

// UploadUsecase validates and stores event images.
type UploadUsecase struct {
	store domain.FileStore
}

// NewUploadUsecase wires the upload usecase.
func NewUploadUsecase(store domain.FileStore) *UploadUsecase {
	return &UploadUsecase{store: store}
}

// UploadFiles validates size/format/count, then stores each image.
func (u *UploadUsecase) UploadFiles(files []*multipart.FileHeader, userID, eventID string) ([]domain.UploadedFile, error) {
	if len(files) == 0 {
		return nil, fmt.Errorf("%w: no files provided", domain.ErrInvalidInput)
	}
	if len(files) > maxImageCount {
		return nil, fmt.Errorf("%w: at most %d images allowed", domain.ErrInvalidInput, maxImageCount)
	}

	out := make([]domain.UploadedFile, 0, len(files))
	for _, fh := range files {
		if fh.Size > maxImageBytes {
			return nil, fmt.Errorf("%w: %s exceeds the 10MB size limit", domain.ErrInvalidInput, fh.Filename)
		}
		if !allowedImageExt[strings.ToLower(ext(fh.Filename))] {
			return nil, fmt.Errorf("%w: invalid file format, only JPG, PNG or WebP allowed", domain.ErrInvalidInput)
		}

		file, err := fh.Open()
		if err != nil {
			return nil, err
		}
		url, publicID, err := u.store.Upload(file, userID, eventID)
		file.Close()
		if err != nil {
			return nil, err
		}
		out = append(out, domain.UploadedFile{URL: url, PublicID: publicID})
	}
	return out, nil
}

// DeleteFiles removes stored images by their public IDs.
func (u *UploadUsecase) DeleteFiles(publicIDs []string) error {
	if len(publicIDs) == 0 {
		return fmt.Errorf("%w: no public_ids provided", domain.ErrInvalidInput)
	}
	return u.store.Delete(publicIDs)
}

// ext returns the lowercased file extension including the dot.
func ext(name string) string {
	if i := strings.LastIndex(name, "."); i >= 0 {
		return name[i:]
	}
	return ""
}
