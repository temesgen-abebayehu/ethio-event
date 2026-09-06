package usecase

import (
	"context"
	"fmt"
	"html/template"
	"strings"
	"time"

	"local-event-backend/domain"

	"github.com/google/uuid"
)

// PaymentUsecase implements the buy-tickets flow for free and paid events.
type PaymentUsecase struct {
	tickets  domain.TicketRepository
	orders   domain.OrderRepository
	users    domain.UserRepository
	events   domain.EventRepository
	gateway  domain.PaymentGateway
	mailer   domain.Mailer
	callback string
	returnTo string
}

// NewPaymentUsecase wires the payment usecase.
func NewPaymentUsecase(
	tickets domain.TicketRepository,
	orders domain.OrderRepository,
	users domain.UserRepository,
	events domain.EventRepository,
	gateway domain.PaymentGateway,
	mailer domain.Mailer,
	callbackURL, returnURL string,
) *PaymentUsecase {
	return &PaymentUsecase{
		tickets: tickets, orders: orders, users: users, events: events,
		gateway: gateway, mailer: mailer, callback: callbackURL, returnTo: returnURL,
	}
}

// Initiate purchases tickets: free events are confirmed immediately, paid events
// return a Chapa checkout URL. A re-submitted unpaid order is reused (idempotent).
func (u *PaymentUsecase) Initiate(ctx context.Context, userID, eventID string, quantity int) (*domain.InitiateResult, error) {
	if quantity < 1 {
		return nil, fmt.Errorf("%w: quantity must be at least 1", domain.ErrInvalidInput)
	}

	event, err := u.events.FindByIDOrSlug(ctx, eventID, true)
	if err != nil {
		return nil, err
	}
	if event.EventDate.Before(time.Now()) {
		return nil, domain.ErrEventPast
	}

	ticket, err := u.tickets.FindByEventID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if quantity > ticket.QuantityTotal-ticket.QuantitySold {
		return nil, domain.ErrSoldOut
	}

	total := ticket.Price * float64(quantity)

	// Free event: confirm immediately, no payment step.
	if ticket.Price == 0 {
		txRef := fmt.Sprintf("EVENT-%d-%s", time.Now().Unix(), uuid.NewString()[:8])
		order, err := u.orders.Create(ctx, &domain.Order{
			UserID: userID, TicketID: ticket.ID, Quantity: quantity,
			TotalPrice: 0, Status: domain.OrderCompleted, ChapaTxRef: txRef,
		})
		if err != nil {
			return nil, err
		}
		return &domain.InitiateResult{TxRef: txRef, TotalPrice: 0, OrderID: order.ID, Status: domain.OrderCompleted}, nil
	}

	// Paid event: reuse an unpaid (pending) order of the same quantity so a re-submit
	// doesn't create duplicates; otherwise start a fresh one. Always (re)open checkout.
	var orderID, txRef string
	if existing, err := u.orders.FindActiveByUserAndTicket(ctx, userID, ticket.ID); err == nil && existing != nil && existing.Quantity == quantity {
		orderID, txRef = existing.ID, existing.ChapaTxRef
	} else {
		txRef = fmt.Sprintf("EVENT-%d-%s", time.Now().Unix(), uuid.NewString()[:8])
		order, err := u.orders.Create(ctx, &domain.Order{
			UserID: userID, TicketID: ticket.ID, Quantity: quantity,
			TotalPrice: total, Status: domain.OrderPending, ChapaTxRef: txRef,
		})
		if err != nil {
			return nil, err
		}
		orderID = order.ID
	}

	buyer, err := u.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	first, last := splitName(buyer.FullName)

	// Embed tx_ref in the return URL so the success page can verify after Chapa redirects back.
	returnURL := u.returnTo
	if strings.Contains(returnURL, "?") {
		returnURL += "&tx_ref=" + txRef
	} else {
		returnURL += "?tx_ref=" + txRef
	}

	checkoutURL, err := u.gateway.Initialize(domain.PaymentInitInput{
		Amount: total, Email: buyer.Email, FirstName: first, LastName: last,
		Phone: phoneOrDefault(buyer.Phone), TxRef: txRef,
		CallbackURL: u.callback, ReturnURL: returnURL,
	})
	if err != nil {
		_ = u.orders.UpdateStatus(ctx, txRef, domain.OrderFailed)
		return nil, fmt.Errorf("failed to start payment: %w", err)
	}

	return &domain.InitiateResult{
		CheckoutURL: checkoutURL, TxRef: txRef, TotalPrice: total,
		OrderID: orderID, Status: domain.OrderPending,
	}, nil
}

// Verify checks a transaction with the gateway and updates the order.
func (u *PaymentUsecase) Verify(ctx context.Context, txRef string) (*domain.Order, error) {
	success, err := u.gateway.Verify(txRef)
	if err != nil {
		return nil, err
	}
	status := domain.OrderFailed
	if success {
		status = domain.OrderCompleted
	}
	if err := u.orders.UpdateStatus(ctx, txRef, status); err != nil {
		return nil, err
	}
	return u.orders.FindByTxRef(ctx, txRef)
}

// HandleCallback updates an order from an asynchronous gateway callback.
func (u *PaymentUsecase) HandleCallback(ctx context.Context, txRef, gatewayStatus string) error {
	status := domain.OrderFailed
	if gatewayStatus == "success" {
		status = domain.OrderCompleted
	}
	return u.orders.UpdateStatus(ctx, txRef, status)
}

// MyTickets lists the authenticated user's orders with their events.
func (u *PaymentUsecase) MyTickets(ctx context.Context, userID string) ([]domain.Order, error) {
	return u.orders.ListByUser(ctx, userID)
}

// EventBuyers lists the purchasers of an event's tickets, for the owner or admin.
func (u *PaymentUsecase) EventBuyers(ctx context.Context, actorID, actorRole, eventID string) ([]domain.EventBuyer, error) {
	event, err := u.events.FindByIDOrSlug(ctx, eventID, false)
	if err != nil {
		return nil, err
	}
	if actorRole != domain.RoleAdmin && event.UserID != actorID {
		return nil, domain.ErrForbidden
	}
	return u.orders.ListEventBuyers(ctx, event.ID)
}

// ScanTicket validates a ticket QR and checks it in, for the event owner or admin.
// The code may be the raw order id or the QR payload "LE-TICKET:<orderID>".
func (u *PaymentUsecase) ScanTicket(ctx context.Context, actorID, actorRole, code string) (*domain.ScanResult, error) {
	orderID := strings.TrimSpace(strings.TrimPrefix(code, "LE-TICKET:"))
	if orderID == "" {
		return nil, fmt.Errorf("%w: empty ticket code", domain.ErrInvalidInput)
	}

	info, err := u.orders.FindTicketScanInfo(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if actorRole != domain.RoleAdmin && info.EventOwnerID != actorID {
		return nil, domain.ErrForbidden
	}
	if info.Status != domain.OrderCompleted {
		return nil, domain.ErrInvalidTicket
	}
	if info.ScannedAt != nil {
		return nil, domain.ErrAlreadyScanned
	}

	scannedAt, err := u.orders.MarkScanned(ctx, orderID, actorID)
	if err != nil {
		return nil, err
	}
	return &domain.ScanResult{
		OrderID: info.OrderID, BuyerName: info.BuyerName, EventTitle: info.EventTitle,
		Quantity: info.Quantity, ScannedAt: scannedAt,
	}, nil
}

// NotifyBuyers emails an event's ticket buyers, for the owner or admin. Recipients
// are restricted to actual buyers of the event to prevent misuse as a mail relay.
func (u *PaymentUsecase) NotifyBuyers(ctx context.Context, actorID, actorRole, eventID string, recipients []string, subject, body string) (int, error) {
	if strings.TrimSpace(subject) == "" || strings.TrimSpace(body) == "" {
		return 0, fmt.Errorf("%w: subject and message are required", domain.ErrInvalidInput)
	}

	event, err := u.events.FindByIDOrSlug(ctx, eventID, false)
	if err != nil {
		return 0, err
	}
	if actorRole != domain.RoleAdmin && event.UserID != actorID {
		return 0, domain.ErrForbidden
	}

	buyers, err := u.orders.ListEventBuyers(ctx, event.ID)
	if err != nil {
		return 0, err
	}
	allowed := make(map[string]bool, len(buyers))
	for _, b := range buyers {
		allowed[strings.ToLower(b.BuyerEmail)] = true
	}

	to := make([]string, 0, len(recipients))
	seen := map[string]bool{}
	for _, r := range recipients {
		e := strings.ToLower(strings.TrimSpace(r))
		if e != "" && allowed[e] && !seen[e] {
			seen[e] = true
			to = append(to, e)
		}
	}
	if len(to) == 0 {
		return 0, fmt.Errorf("%w: no valid recipients", domain.ErrInvalidInput)
	}

	html := "<div style=\"font-family:sans-serif;font-size:15px;color:#111827\">" +
		strings.ReplaceAll(template.HTMLEscapeString(body), "\n", "<br>") + "</div>"
	if err := u.mailer.Send(to, subject, html); err != nil {
		return 0, err
	}
	return len(to), nil
}

// splitName splits a full name into first and last parts for the gateway.
func splitName(full string) (string, string) {
	parts := strings.Fields(full)
	switch len(parts) {
	case 0:
		return "User", "."
	case 1:
		return parts[0], "."
	default:
		return parts[0], strings.Join(parts[1:], " ")
	}
}

func phoneOrDefault(phone *string) string {
	if phone != nil && *phone != "" {
		return *phone
	}
	return "0900000000"
}
