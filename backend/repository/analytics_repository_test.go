package repository

import (
	"context"
	"testing"

	"local-event-backend/domain"
)

func TestAnalyticsRepository_Get(t *testing.T) {
	requireDB(t)
	resetData(t)
	ctx := context.Background()

	user := seedUser(t, "buyer@e.com")
	ev := seedEvent(t, user.ID, 500, 100)

	// A completed order drives the sold counters (trigger updates quantity_sold).
	if _, err := NewOrderRepository(testPool).Create(ctx, &domain.Order{
		UserID: user.ID, TicketID: ev.Ticket.ID, Quantity: 3,
		TotalPrice: 1500, Status: domain.OrderCompleted, ChapaTxRef: "ref-a",
	}); err != nil {
		t.Fatalf("seed order: %v", err)
	}

	a, err := NewAnalyticsRepository(testPool).Get(ctx)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if a.TotalUsers < 1 {
		t.Errorf("TotalUsers = %d; want >= 1", a.TotalUsers)
	}
	if a.TotalTicketsSold != 3 {
		t.Errorf("TotalTicketsSold = %d; want 3", a.TotalTicketsSold)
	}
	if a.TopCategory == nil || a.TopCategory.TicketsSold != 3 {
		t.Errorf("TopCategory = %+v; want 3 sold", a.TopCategory)
	}
}
