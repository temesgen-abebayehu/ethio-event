package repository

import (
	"context"
	"testing"

	"local-event-backend/domain"
)

func TestOrderRepository(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewOrderRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "buyer@e.com")
	ev := seedEvent(t, user.ID, 500, 100)

	order, err := repo.Create(ctx, &domain.Order{
		UserID: user.ID, TicketID: ev.Ticket.ID, Quantity: 2,
		TotalPrice: 1000, Status: domain.OrderPending, ChapaTxRef: "ref-1",
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if order.ID == "" {
		t.Fatal("order id not returned")
	}

	active, err := repo.FindActiveByUserAndTicket(ctx, user.ID, ev.Ticket.ID)
	if err != nil || active.ID != order.ID {
		t.Fatalf("FindActiveByUserAndTicket = %+v, %v", active, err)
	}

	if err := repo.UpdateStatus(ctx, "ref-1", domain.OrderCompleted); err != nil {
		t.Fatalf("UpdateStatus: %v", err)
	}
	byRef, err := repo.FindByTxRef(ctx, "ref-1")
	if err != nil || byRef.Status != domain.OrderCompleted {
		t.Fatalf("FindByTxRef = %+v, %v", byRef, err)
	}

	orders, err := repo.ListByUser(ctx, user.ID)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}
	if len(orders) != 1 || orders[0].Event == nil {
		t.Errorf("ListByUser = %+v; want 1 order with event", orders)
	}
}
