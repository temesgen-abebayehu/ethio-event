package dto

import (
	"time"

	"local-event-backend/domain"
)

// CategoryResponse is the wire representation of a category.
type CategoryResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	IsActive    bool    `json:"is_active"`
	EventCount  int     `json:"event_count"`
}

// ImageResponse is the wire representation of an event image.
type ImageResponse struct {
	ID         string `json:"id"`
	URL        string `json:"url"`
	PublicID   string `json:"public_id"`
	IsFeatured bool   `json:"is_featured"`
}

// TagResponse is the wire representation of a tag.
type TagResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// TicketResponse is the wire representation of a ticket template.
type TicketResponse struct {
	ID            string  `json:"id"`
	Price         float64 `json:"price"`
	QuantityTotal int     `json:"quantity_total"`
	QuantitySold  int     `json:"quantity_sold"`
}

// EventResponse is the full event payload returned to clients.
type EventResponse struct {
	ID            string            `json:"id"`
	Slug          string            `json:"slug"`
	UserID        string            `json:"user_id"`
	Title         string            `json:"title"`
	Description   string            `json:"description"`
	Venue         string            `json:"venue"`
	Address       string            `json:"address"`
	Latitude      float64           `json:"latitude"`
	Longitude     float64           `json:"longitude"`
	Price         float64           `json:"price"`
	EventDate     time.Time         `json:"event_date"`
	Status        string            `json:"status"`
	CreatedAt     time.Time         `json:"created_at"`
	OrganizerName string            `json:"organizer_name"`
	Category      *CategoryResponse `json:"category,omitempty"`
	Images        []ImageResponse   `json:"images"`
	Tags          []TagResponse     `json:"tags"`
	Ticket        *TicketResponse   `json:"ticket,omitempty"`

	TicketsRemaining int    `json:"tickets_remaining"`
	IsSoldOut        bool   `json:"is_sold_out"`
	TimeStatus       string `json:"time_status"`
}

// EventListResponse is a paginated list of events.
type EventListResponse struct {
	Events     []EventResponse `json:"events"`
	TotalCount int             `json:"total_count"`
}

// EventImageInput is a stored-image reference in a create/update request.
type EventImageInput struct {
	URL        string `json:"url"`
	PublicID   string `json:"public_id"`
	IsFeatured bool   `json:"is_featured"`
}

// EventRequest is the body for creating or updating an event.
type EventRequest struct {
	Title          string            `json:"title"`
	Description    string            `json:"description"`
	CategoryID     string            `json:"category_id"`
	Venue          string            `json:"venue"`
	Address        string            `json:"address"`
	Latitude       float64           `json:"latitude"`
	Longitude      float64           `json:"longitude"`
	Price          float64           `json:"price"`
	EventDate      time.Time         `json:"event_date"`
	TicketQuantity int               `json:"ticket_quantity"`
	Tags           []string          `json:"tags"`
	Images         []EventImageInput `json:"images"`
	Status         string            `json:"status"`
}

// ToInput maps the request DTO into a domain event input.
func (r EventRequest) ToInput() domain.EventInput {
	images := make([]domain.EventImage, 0, len(r.Images))
	for _, img := range r.Images {
		images = append(images, domain.EventImage{URL: img.URL, PublicID: img.PublicID, IsFeatured: img.IsFeatured})
	}
	return domain.EventInput{
		Title: r.Title, Description: r.Description, CategoryID: r.CategoryID,
		Venue: r.Venue, Address: r.Address, Latitude: r.Latitude, Longitude: r.Longitude,
		Price: r.Price, EventDate: r.EventDate, TicketQuantity: r.TicketQuantity,
		Tags: r.Tags, Images: images, Status: r.Status,
	}
}

// NewCategoryResponse maps a domain category to its response DTO.
func NewCategoryResponse(c domain.Category) CategoryResponse {
	return CategoryResponse{
		ID: c.ID, Name: c.Name, Slug: c.Slug, Description: c.Description,
		Icon: c.Icon, Color: c.Color, IsActive: c.IsActive, EventCount: c.EventCount,
	}
}

// NewEventResponse maps a domain event to its full response DTO.
func NewEventResponse(e domain.Event) EventResponse {
	resp := EventResponse{
		ID: e.ID, Slug: e.Slug, UserID: e.UserID, Title: e.Title, Description: e.Description,
		Venue: e.Venue, Address: e.Address, Latitude: e.Latitude, Longitude: e.Longitude,
		Price: e.Price, EventDate: e.EventDate, Status: e.Status, CreatedAt: e.CreatedAt,
		OrganizerName: e.OrganizerName, Images: []ImageResponse{}, Tags: []TagResponse{},
		TicketsRemaining: e.TicketsRemaining(), IsSoldOut: e.IsSoldOut(), TimeStatus: e.TimeStatus(),
	}
	if e.Category != nil {
		c := NewCategoryResponse(*e.Category)
		resp.Category = &c
	}
	for _, img := range e.Images {
		resp.Images = append(resp.Images, ImageResponse{ID: img.ID, URL: img.URL, PublicID: img.PublicID, IsFeatured: img.IsFeatured})
	}
	for _, t := range e.Tags {
		resp.Tags = append(resp.Tags, TagResponse{ID: t.ID, Name: t.Name})
	}
	if e.Ticket != nil {
		resp.Ticket = &TicketResponse{ID: e.Ticket.ID, Price: e.Ticket.Price, QuantityTotal: e.Ticket.QuantityTotal, QuantitySold: e.Ticket.QuantitySold}
	}
	return resp
}

// NewEventListResponse maps a slice of events into a list DTO.
func NewEventListResponse(events []domain.Event, total int) EventListResponse {
	out := EventListResponse{Events: make([]EventResponse, 0, len(events)), TotalCount: total}
	for _, e := range events {
		out.Events = append(out.Events, NewEventResponse(e))
	}
	return out
}
