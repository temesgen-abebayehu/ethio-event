package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"local-event-backend/domain"
)

func TestPaymentController_Initiate(t *testing.T) {
	uc := &fakePaymentUsecase{result: &domain.InitiateResult{OrderID: "o1", Status: domain.OrderPending, CheckoutURL: "https://chapa", TxRef: "ref"}}
	c := NewPaymentController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/payments/initiate", strings.NewReader(`{"event_id":"e1","quantity":2}`))
	rec := httptest.NewRecorder()
	c.Initiate(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d; want 200", rec.Code)
	}
	var resp struct {
		CheckoutURL string `json:"checkout_url"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.CheckoutURL != "https://chapa" {
		t.Errorf("checkout_url = %q", resp.CheckoutURL)
	}
}

func TestPaymentController_Initiate_SoldOut(t *testing.T) {
	uc := &fakePaymentUsecase{err: domain.ErrSoldOut}
	c := NewPaymentController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/payments/initiate", strings.NewReader(`{"event_id":"e1","quantity":2}`))
	rec := httptest.NewRecorder()
	c.Initiate(rec, req)

	if rec.Code != http.StatusConflict {
		t.Errorf("status = %d; want 409", rec.Code)
	}
}

func TestPaymentController_Verify(t *testing.T) {
	uc := &fakePaymentUsecase{order: &domain.Order{ID: "o1", Status: domain.OrderCompleted}}
	c := NewPaymentController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/payments/verify", strings.NewReader(`{"tx_ref":"ref"}`))
	rec := httptest.NewRecorder()
	c.Verify(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestPaymentController_Callback(t *testing.T) {
	c := NewPaymentController(&fakePaymentUsecase{})
	req := httptest.NewRequest(http.MethodPost, "/webhook/chapa", strings.NewReader(`{"tx_ref":"ref","status":"success"}`))
	rec := httptest.NewRecorder()
	c.Callback(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestPaymentController_MyTickets(t *testing.T) {
	uc := &fakePaymentUsecase{orders: []domain.Order{{ID: "o1", Status: domain.OrderCompleted}}}
	c := NewPaymentController(uc)

	req := httptest.NewRequest(http.MethodGet, "/api/me/tickets", nil)
	rec := httptest.NewRecorder()
	c.MyTickets(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}
