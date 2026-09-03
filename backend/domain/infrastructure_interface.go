package domain

import "mime/multipart"

// This file groups every infrastructure port: interfaces implemented by the
// infrastructure layer (third-party services) and consumed by the usecases.

// Mailer sends transactional emails.
type Mailer interface {
	SendPasswordReset(to, resetLink string) error
	Send(to []string, subject, htmlBody string) error
}

// FileStore abstracts the image storage provider (Cloudinary).
type FileStore interface {
	Upload(file multipart.File, userID, eventID string) (url, publicID string, err error)
	Delete(publicIDs []string) error
}

// PaymentInitInput is the data handed to the payment gateway.
type PaymentInitInput struct {
	Amount      float64
	Email       string
	FirstName   string
	LastName    string
	Phone       string
	TxRef       string
	CallbackURL string
	ReturnURL   string
}

// PaymentGateway abstracts the third-party payment provider (Chapa).
type PaymentGateway interface {
	Initialize(in PaymentInitInput) (checkoutURL string, err error)
	Verify(txRef string) (success bool, err error)
}
