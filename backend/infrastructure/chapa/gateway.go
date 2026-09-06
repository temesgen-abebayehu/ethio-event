package chapa

import (
	"fmt"

	"local-event-backend/domain"
)

// Gateway adapts the Chapa client to the domain.PaymentGateway port.
type Gateway struct {
	client *Client
}

// NewGateway builds a Chapa-backed payment gateway.
func NewGateway(secretKey string) *Gateway {
	return &Gateway{client: NewClient(secretKey)}
}

// Initialize starts a Chapa checkout and returns the payment URL.
func (g *Gateway) Initialize(in domain.PaymentInitInput) (string, error) {
	resp, err := g.client.InitializePayment(InitializePaymentRequest{
		Amount:      fmt.Sprintf("%.2f", in.Amount),
		Currency:    "ETB",
		Email:       in.Email,
		FirstName:   in.FirstName,
		LastName:    in.LastName,
		PhoneNumber: in.Phone,
		TxRef:       in.TxRef,
		CallbackURL: in.CallbackURL,
		ReturnURL:   in.ReturnURL,
	})
	if err != nil {
		return "", err
	}
	return resp.Data.CheckoutURL, nil
}

// Verify reports whether a transaction completed successfully.
func (g *Gateway) Verify(txRef string) (bool, error) {
	resp, err := g.client.VerifyPayment(txRef)
	if err != nil {
		return false, err
	}
	return resp.Data.Status == "success", nil
}
