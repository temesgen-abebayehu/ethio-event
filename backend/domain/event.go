package domain

import "time"

// Event publication status.
const (
	EventDraft     = "draft"
	EventPublished = "published"
)

// EventImage is an image belonging to an event.
type EventImage struct {
	ID         string
	URL        string
	PublicID   string
	IsFeatured bool
}

// Event is the core event entity with its related data loaded.
type Event struct {
	ID          string
	Slug        string
	UserID      string
	CategoryID  string
	Title       string
	Description string
	Venue       string
	Address     string
	Latitude    float64
	Longitude   float64
	Price       float64
	EventDate   time.Time
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time

	// Related data.
	Category      *Category
	OrganizerName string
	Images        []EventImage
	Tags          []Tag
	Ticket        *Ticket
}

// TicketsRemaining is the number of unsold tickets, or 0 when no ticket exists.
func (e *Event) TicketsRemaining() int {
	if e.Ticket == nil {
		return 0
	}
	remaining := e.Ticket.QuantityTotal - e.Ticket.QuantitySold
	if remaining < 0 {
		return 0
	}
	return remaining
}

// IsSoldOut reports whether a ticketed event has no remaining capacity.
func (e *Event) IsSoldOut() bool {
	return e.Ticket != nil && e.TicketsRemaining() == 0
}

// TimeStatus derives the event's temporal status from its date.
func (e *Event) TimeStatus() string {
	now := time.Now()
	switch {
	case e.EventDate.Before(now):
		return "past"
	case e.EventDate.After(now.Add(time.Hour)):
		return "upcoming"
	default:
		return "ongoing"
	}
}

// EventInput carries the data to create or update an event.
type EventInput struct {
	Title          string
	Description    string
	CategoryID     string
	Venue          string
	Address        string
	Latitude       float64
	Longitude      float64
	Price          float64
	EventDate      time.Time
	TicketQuantity int
	Tags           []string
	Images         []EventImage
	Status         string
}

// EventFilter holds the parameters used to query the event list.
type EventFilter struct {
	Search      string
	CategoryID  string
	MinPrice    *float64
	MaxPrice    *float64
	FreeOnly    bool
	DateFrom    *time.Time
	DateTo      *time.Time
	OrganizerID string // when set, restrict to a single organizer's events
	PublicOnly  bool   // when true, only published events
	Sort        string // event_date | price | created_at
	Order       string // asc | desc
	Limit       int
	Offset      int
}

// NearbyEvent is a distance result from the nearby-events query.
type NearbyEvent struct {
	EventID    string
	DistanceKM float64
}
