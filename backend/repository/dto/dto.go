// Package dto holds the database-facing data structures used by the repository
// layer. These map raw query results (including JSON-aggregated relations) into
// domain entities, keeping SQL details out of the rest of the application.
package dto

import (
	"time"

	"local-event-backend/domain"
)

// CategoryRow mirrors a categories row (and JSON-embedded category data).
type CategoryRow struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	Color       *string `json:"color"`
	IsActive    bool    `json:"is_active"`
	EventCount  int     `json:"event_count"`
}

// ToDomain converts a CategoryRow into a domain.Category.
func (c CategoryRow) ToDomain() domain.Category {
	return domain.Category{
		ID:          c.ID,
		Name:        c.Name,
		Slug:        c.Slug,
		Description: c.Description,
		Icon:        c.Icon,
		Color:       c.Color,
		IsActive:    c.IsActive,
		EventCount:  c.EventCount,
	}
}

// ImageRow mirrors an event_images row.
type ImageRow struct {
	ID         string `json:"id"`
	URL        string `json:"url"`
	PublicID   string `json:"public_id"`
	IsFeatured bool   `json:"is_featured"`
}

// TagRow mirrors a tags row.
type TagRow struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// TicketRow mirrors a tickets row.
type TicketRow struct {
	ID            string  `json:"id"`
	Price         float64 `json:"price"`
	QuantityTotal int     `json:"quantity_total"`
	QuantitySold  int     `json:"quantity_sold"`
}

// EventRow mirrors the JSON-aggregated event returned by the event queries.
type EventRow struct {
	ID            string       `json:"id"`
	Slug          string       `json:"slug"`
	UserID        string       `json:"user_id"`
	CategoryID    string       `json:"category_id"`
	Title         string       `json:"title"`
	Description   string       `json:"description"`
	Venue         string       `json:"venue"`
	Address       string       `json:"address"`
	Latitude      float64      `json:"latitude"`
	Longitude     float64      `json:"longitude"`
	Price         float64      `json:"price"`
	EventDate     time.Time    `json:"event_date"`
	Status        string       `json:"status"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	OrganizerName string       `json:"organizer_name"`
	Category      *CategoryRow `json:"category"`
	Images        []ImageRow   `json:"images"`
	Tags          []TagRow     `json:"tags"`
	Ticket        *TicketRow   `json:"ticket"`
}

// ToDomain converts an EventRow into a fully-populated domain.Event,
// deriving related data; computed fields are methods on domain.Event.
func (e EventRow) ToDomain() domain.Event {
	ev := domain.Event{
		ID:            e.ID,
		Slug:          e.Slug,
		UserID:        e.UserID,
		CategoryID:    e.CategoryID,
		Title:         e.Title,
		Description:   e.Description,
		Venue:         e.Venue,
		Address:       e.Address,
		Latitude:      e.Latitude,
		Longitude:     e.Longitude,
		Price:         e.Price,
		EventDate:     e.EventDate,
		Status:        e.Status,
		CreatedAt:     e.CreatedAt,
		UpdatedAt:     e.UpdatedAt,
		OrganizerName: e.OrganizerName,
	}

	if e.Category != nil {
		c := e.Category.ToDomain()
		ev.Category = &c
	}
	for _, img := range e.Images {
		ev.Images = append(ev.Images, domain.EventImage{
			ID: img.ID, URL: img.URL, PublicID: img.PublicID, IsFeatured: img.IsFeatured,
		})
	}
	for _, t := range e.Tags {
		ev.Tags = append(ev.Tags, domain.Tag{ID: t.ID, Name: t.Name})
	}
	if e.Ticket != nil {
		ev.Ticket = &domain.Ticket{
			ID:            e.Ticket.ID,
			EventID:       e.ID,
			Price:         e.Ticket.Price,
			QuantityTotal: e.Ticket.QuantityTotal,
			QuantitySold:  e.Ticket.QuantitySold,
		}
	}
	return ev
}
