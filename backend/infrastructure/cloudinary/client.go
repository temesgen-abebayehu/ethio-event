package cloudinary

import (
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/google/uuid"
)

// Client wraps the Cloudinary SDK and satisfies usecase.FileStore.
type Client struct {
	cld *cloudinary.Cloudinary
}

// NewClient builds a Cloudinary client from credentials.
func NewClient(cloudName, apiKey, apiSecret string) (*Client, error) {
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, err
	}
	return &Client{cld: cld}, nil
}

// Upload stores a file under events/{userID}/{eventID}/{timestamp}_{uuid}.
func (c *Client) Upload(file multipart.File, userID, eventID string) (string, string, error) {
	ctx := context.Background()
	publicID := fmt.Sprintf("events/%s/%s/%d_%s", userID, eventID, time.Now().Unix(), uuid.NewString()[:8])

	res, err := c.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID: publicID,
		Folder:   "events",
	})
	if err != nil {
		return "", "", err
	}
	return res.SecureURL, res.PublicID, nil
}

// Delete removes images by their public IDs.
func (c *Client) Delete(publicIDs []string) error {
	ctx := context.Background()
	for _, id := range publicIDs {
		if _, err := c.cld.Upload.Destroy(ctx, uploader.DestroyParams{PublicID: id}); err != nil {
			return err
		}
	}
	return nil
}
