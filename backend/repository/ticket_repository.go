package repository

import (
	"context"
	"errors"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ticketRepository struct {
	db *pgxpool.Pool
}

// NewTicketRepository builds a Postgres-backed TicketRepository.
func NewTicketRepository(db *pgxpool.Pool) domain.TicketRepository {
	return &ticketRepository{db: db}
}

func (r *ticketRepository) FindByEventID(ctx context.Context, eventID string) (*domain.Ticket, error) {
	const q = `
		SELECT id, event_id, price, quantity_total, quantity_sold
		FROM tickets WHERE event_id = $1 LIMIT 1`

	t := &domain.Ticket{}
	err := r.db.QueryRow(ctx, q, eventID).Scan(&t.ID, &t.EventID, &t.Price, &t.QuantityTotal, &t.QuantitySold)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return t, err
}
