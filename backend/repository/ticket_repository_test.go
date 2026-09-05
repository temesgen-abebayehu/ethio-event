package repository

import (
	"context"
	"testing"
)

func TestTicketRepository_FindByEventID(t *testing.T) {
	requireDB(t)
	resetData(t)

	user := seedUser(t, "owner@e.com")
	ev := seedEvent(t, user.ID, 250, 30)

	ticket, err := NewTicketRepository(testPool).FindByEventID(context.Background(), ev.ID)
	if err != nil {
		t.Fatalf("FindByEventID: %v", err)
	}
	if ticket.Price != 250 || ticket.QuantityTotal != 30 {
		t.Errorf("ticket = %+v; want price 250 qty 30", ticket)
	}
}
