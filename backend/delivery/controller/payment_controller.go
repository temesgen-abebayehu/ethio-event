package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/middleware"

	"github.com/gorilla/mux"
)

// PaymentController exposes the buy-tickets flow.
type PaymentController struct {
	payments domain.PaymentUsecase
}

// NewPaymentController builds a PaymentController.
func NewPaymentController(payments domain.PaymentUsecase) *PaymentController {
	return &PaymentController{payments: payments}
}

// Initiate handles POST /api/payments/initiate.
func (c *PaymentController) Initiate(w http.ResponseWriter, r *http.Request) {
	var req dto.InitiatePaymentRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	res, err := c.payments.Initiate(r.Context(), middleware.UserIDFromContext(r.Context()), req.EventID, req.Quantity)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewInitiatePaymentResponse(res))
}

// Verify handles POST /api/payments/verify.
func (c *PaymentController) Verify(w http.ResponseWriter, r *http.Request) {
	var req dto.VerifyPaymentRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	order, err := c.payments.Verify(r.Context(), req.TxRef)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewOrderResponse(*order))
}

// ScanTicket handles POST /api/tickets/scan (event owner or admin only).
func (c *PaymentController) ScanTicket(w http.ResponseWriter, r *http.Request) {
	var req dto.ScanTicketRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	res, err := c.payments.ScanTicket(ctx, middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx), req.Code)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewScanResultResponse(res))
}

// NotifyBuyers handles POST /api/events/{id}/notify (event owner or admin only).
func (c *PaymentController) NotifyBuyers(w http.ResponseWriter, r *http.Request) {
	var req dto.NotifyBuyersRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	ctx := r.Context()
	sent, err := c.payments.NotifyBuyers(ctx, middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx), mux.Vars(r)["id"], req.Recipients, req.Subject, req.Body)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"sent": sent})
}

// Callback handles POST /webhook/chapa (server-to-server).
func (c *PaymentController) Callback(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TxRef  string `json:"tx_ref"`
		Status string `json:"status"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if err := c.payments.HandleCallback(r.Context(), body.TxRef, body.Status); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to process callback")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "ok"})
}

// MyTickets handles GET /api/me/tickets.
func (c *PaymentController) MyTickets(w http.ResponseWriter, r *http.Request) {
	orders, err := c.payments.MyTickets(r.Context(), middleware.UserIDFromContext(r.Context()))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewOrderList(orders))
}

// EventBuyers handles GET /api/events/{id}/buyers (owner or admin only).
func (c *PaymentController) EventBuyers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	buyers, err := c.payments.EventBuyers(ctx, middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx), mux.Vars(r)["id"])
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewEventBuyerList(buyers))
}
