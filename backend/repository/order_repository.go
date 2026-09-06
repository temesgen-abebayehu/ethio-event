package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"local-event-backend/domain"
	"local-event-backend/repository/dto"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type orderRepository struct {
	db *pgxpool.Pool
}

// NewOrderRepository builds a Postgres-backed OrderRepository.
func NewOrderRepository(db *pgxpool.Pool) domain.OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, o *domain.Order) (*domain.Order, error) {
	const q = `
		INSERT INTO orders (user_id, ticket_id, quantity, total_price, status, chapa_tx_ref)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at`
	err := r.db.QueryRow(ctx, q, o.UserID, o.TicketID, o.Quantity, o.TotalPrice, o.Status, o.ChapaTxRef).
		Scan(&o.ID, &o.CreatedAt)
	return o, err
}

func (r *orderRepository) UpdateStatus(ctx context.Context, txRef, status string) error {
	_, err := r.db.Exec(ctx, `UPDATE orders SET status = $2 WHERE chapa_tx_ref = $1`, txRef, status)
	return err
}

func (r *orderRepository) FindByTxRef(ctx context.Context, txRef string) (*domain.Order, error) {
	const q = `
		SELECT id, user_id, ticket_id, quantity, total_price, status, chapa_tx_ref, created_at
		FROM orders WHERE chapa_tx_ref = $1`

	o := &domain.Order{}
	err := r.db.QueryRow(ctx, q, txRef).Scan(
		&o.ID, &o.UserID, &o.TicketID, &o.Quantity, &o.TotalPrice, &o.Status, &o.ChapaTxRef, &o.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return o, err
}

// FindActiveByUserAndTicket returns an unpaid (pending) order for the same user
// and ticket, used to avoid creating duplicate orders on re-submit.
func (r *orderRepository) FindActiveByUserAndTicket(ctx context.Context, userID, ticketID string) (*domain.Order, error) {
	const q = `
		SELECT id, user_id, ticket_id, quantity, total_price, status, chapa_tx_ref, created_at
		FROM orders
		WHERE user_id = $1 AND ticket_id = $2 AND status = 'pending'
		ORDER BY created_at DESC LIMIT 1`

	o := &domain.Order{}
	err := r.db.QueryRow(ctx, q, userID, ticketID).Scan(
		&o.ID, &o.UserID, &o.TicketID, &o.Quantity, &o.TotalPrice, &o.Status, &o.ChapaTxRef, &o.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return o, err
}

func (r *orderRepository) ListByUser(ctx context.Context, userID string) ([]domain.Order, error) {
	// Each order carries its ticket's event as JSON for the "My Tickets" view.
	q := `
		SELECT o.id, o.user_id, o.ticket_id, o.quantity, o.total_price, o.status, o.chapa_tx_ref, o.scanned_at, o.created_at,
		       (SELECT ` + eventJSONExpr + ` FROM events e WHERE e.id = tk.event_id) AS event
		FROM orders o
		JOIN tickets tk ON tk.id = o.ticket_id
		WHERE o.user_id = $1
		ORDER BY o.created_at DESC`

	rows, err := r.db.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []domain.Order{}
	for rows.Next() {
		var o domain.Order
		var raw []byte
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.TicketID, &o.Quantity, &o.TotalPrice, &o.Status, &o.ChapaTxRef, &o.ScannedAt, &o.CreatedAt, &raw,
		); err != nil {
			return nil, err
		}
		if len(raw) > 0 {
			var row dto.EventRow
			if err := json.Unmarshal(raw, &row); err == nil {
				ev := row.ToDomain()
				o.Event = &ev
			}
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

// ListEventBuyers returns everyone who ordered tickets for an event.
func (r *orderRepository) ListEventBuyers(ctx context.Context, eventID string) ([]domain.EventBuyer, error) {
	const q = `
		SELECT o.id, u.full_name, u.email, o.quantity, o.total_price, o.status, o.scanned_at, o.created_at
		FROM orders o
		JOIN tickets tk ON tk.id = o.ticket_id
		JOIN users u ON u.id = o.user_id
		WHERE tk.event_id = $1
		ORDER BY o.created_at DESC`

	rows, err := r.db.Query(ctx, q, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	buyers := []domain.EventBuyer{}
	for rows.Next() {
		var b domain.EventBuyer
		if err := rows.Scan(&b.OrderID, &b.BuyerName, &b.BuyerEmail, &b.Quantity, &b.TotalPrice, &b.Status, &b.ScannedAt, &b.CreatedAt); err != nil {
			return nil, err
		}
		buyers = append(buyers, b)
	}
	return buyers, rows.Err()
}

// FindTicketScanInfo loads the data needed to validate and check in a ticket order.
func (r *orderRepository) FindTicketScanInfo(ctx context.Context, orderID string) (*domain.TicketScanInfo, error) {
	const q = `
		SELECT o.id, o.quantity, o.status, o.scanned_at, u.full_name, e.title, e.user_id
		FROM orders o
		JOIN tickets tk ON tk.id = o.ticket_id
		JOIN events e ON e.id = tk.event_id
		JOIN users u ON u.id = o.user_id
		WHERE o.id = $1`

	info := &domain.TicketScanInfo{}
	err := r.db.QueryRow(ctx, q, orderID).Scan(
		&info.OrderID, &info.Quantity, &info.Status, &info.ScannedAt,
		&info.BuyerName, &info.EventTitle, &info.EventOwnerID,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return info, err
}

// MarkScanned records a check-in and returns the scan timestamp.
func (r *orderRepository) MarkScanned(ctx context.Context, orderID, scannerID string) (time.Time, error) {
	var scannedAt time.Time
	err := r.db.QueryRow(ctx,
		`UPDATE orders SET scanned_at = NOW(), scanned_by = $2 WHERE id = $1 RETURNING scanned_at`,
		orderID, scannerID,
	).Scan(&scannedAt)
	return scannedAt, err
}
