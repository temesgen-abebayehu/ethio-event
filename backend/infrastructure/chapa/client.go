package chapa

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Client struct {
	secretKey string
	baseURL   string
}

func NewClient(secretKey string) *Client {
	return &Client{
		secretKey: secretKey,
		baseURL:   "https://api.chapa.co/v1",
	}
}

type InitializePaymentRequest struct {
	Amount        string         `json:"amount"`
	Currency      string         `json:"currency"`
	Email         string         `json:"email"`
	FirstName     string         `json:"first_name"`
	LastName      string         `json:"last_name"`
	PhoneNumber   string         `json:"phone_number,omitempty"`
	TxRef         string         `json:"tx_ref"`
	CallbackURL   string         `json:"callback_url"`
	ReturnURL     string         `json:"return_url"`
	Customization *Customization `json:"customization,omitempty"`
}

type Customization struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
}

type InitializePaymentResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		CheckoutURL string `json:"checkout_url"`
	} `json:"data"`
}

func (c *Client) InitializePayment(req InitializePaymentRequest) (*InitializePaymentResponse, error) {
	jsonData, _ := json.Marshal(req)

	httpReq, _ := http.NewRequest("POST", c.baseURL+"/transaction/initialize", bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Authorization", "Bearer "+c.secretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result InitializePaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("chapa error: %s", result.Message)
	}

	return &result, nil
}

type VerifyPaymentResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Status string  `json:"status"`
		Amount float64 `json:"amount"`
		TxRef  string  `json:"tx_ref"`
	} `json:"data"`
}

func (c *Client) VerifyPayment(txRef string) (*VerifyPaymentResponse, error) {
	url := fmt.Sprintf("%s/transaction/verify/%s", c.baseURL, txRef)

	httpReq, _ := http.NewRequest("GET", url, nil)
	httpReq.Header.Set("Authorization", "Bearer "+c.secretKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result VerifyPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
