package domain

import "time"

// Order statuses.
const (
	OrderPending   = "pending"
	OrderCompleted = "completed"
	OrderFailed    = "failed"
	OrderRefunded  = "refunded"
)

// Ticket is an event's ticket template.
type Ticket struct {
	ID            string
	EventID       string
	Price         float64
	QuantityTotal int
	QuantitySold  int
}

// Order is a ticket purchase.
type Order struct {
	ID         string
	UserID     string
	TicketID   string
	Quantity   int
	TotalPrice float64
	Status     string
	ChapaTxRef string
	ScannedAt  *time.Time
	CreatedAt  time.Time

	// Related data, populated when listing a user's tickets.
	Event *Event
}

// EventBuyer is a purchaser of tickets for an event, shown to the organizer.
type EventBuyer struct {
	OrderID    string
	BuyerName  string
	BuyerEmail string
	Quantity   int
	TotalPrice float64
	Status     string
	ScannedAt  *time.Time
	CreatedAt  time.Time
}

// TicketScanInfo is the data needed to validate and check in a ticket order.
type TicketScanInfo struct {
	OrderID      string
	Quantity     int
	Status       string
	ScannedAt    *time.Time
	BuyerName    string
	EventTitle   string
	EventOwnerID string
}

// ScanResult is returned after a successful ticket check-in.
type ScanResult struct {
	OrderID    string
	BuyerName  string
	EventTitle string
	Quantity   int
	ScannedAt  time.Time
}
