package repository

import (
	"context"
	"errors"
	"testing"

	"local-event-backend/domain"
)

func TestEventRepository_CRUD(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewEventRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "owner@e.com")
	ev := seedEvent(t, user.ID, 500, 100)

	if ev.Slug == "" {
		t.Error("event slug was not auto-generated")
	}
	if ev.Ticket == nil || ev.Ticket.QuantityTotal != 100 {
		t.Errorf("event ticket = %+v; want quantity_total 100", ev.Ticket)
	}
	if len(ev.Tags) == 0 || len(ev.Images) == 0 {
		t.Error("event tags/images not persisted")
	}

	// Lookup by id and by slug.
	byID, err := repo.FindByIDOrSlug(ctx, ev.ID, true)
	if err != nil || byID.ID != ev.ID {
		t.Fatalf("FindByIDOrSlug(id) = %+v, %v", byID, err)
	}
	bySlug, err := repo.FindByIDOrSlug(ctx, ev.Slug, true)
	if err != nil || bySlug.ID != ev.ID {
		t.Fatalf("FindByIDOrSlug(slug) = %+v, %v", bySlug, err)
	}

	// Update.
	in := domain.EventInput{
		Title: "Updated Title", Description: "d", CategoryID: ev.CategoryID,
		Venue: "V", Address: "A", Latitude: 9, Longitude: 38, Price: 600,
		EventDate: timeFuture(), TicketQuantity: 120,
		Tags: []string{"jazz", "live"}, Images: []domain.EventImage{{URL: "u2", PublicID: "p2", IsFeatured: true}},
		Status: domain.EventPublished,
	}
	updated, err := repo.Update(ctx, ev.ID, in)
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.Title != "Updated Title" || updated.Ticket.QuantityTotal != 120 {
		t.Errorf("update not applied: %+v", updated)
	}

	// Delete.
	if err := repo.Delete(ctx, ev.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, err := repo.FindByIDOrSlug(ctx, ev.ID, true); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("after delete error = %v; want ErrNotFound", err)
	}
}

func TestEventRepository_ListFilters(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewEventRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "owner@e.com")
	seedEvent(t, user.ID, 0, 50) // "Addis Jazz Night", tag jazz

	// Text search matches the tag/title.
	events, total, err := repo.List(ctx, domain.EventFilter{Search: "jazz", PublicOnly: true, Limit: 10})
	if err != nil {
		t.Fatalf("List(search): %v", err)
	}
	if total != 1 || len(events) != 1 {
		t.Errorf("search total = %d; want 1", total)
	}

	// Free-only filter.
	free, _, err := repo.List(ctx, domain.EventFilter{FreeOnly: true, PublicOnly: true, Limit: 10})
	if err != nil {
		t.Fatalf("List(free): %v", err)
	}
	if len(free) != 1 {
		t.Errorf("free events = %d; want 1", len(free))
	}

	// Non-matching search returns empty (not error).
	none, total, err := repo.List(ctx, domain.EventFilter{Search: "zznomatch", PublicOnly: true, Limit: 10})
	if err != nil {
		t.Fatalf("List(none): %v", err)
	}
	if total != 0 || len(none) != 0 {
		t.Errorf("no-match total = %d; want 0", total)
	}
}

func TestEventRepository_Nearby(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewEventRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "owner@e.com")
	seedEvent(t, user.ID, 0, 10) // located at lat 9.0, lng 38.7

	results, err := repo.Nearby(ctx, 9.0, 38.7, 50)
	if err != nil {
		t.Fatalf("Nearby: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("nearby results = %d; want 1", len(results))
	}
}
