package repository

import (
	"context"

	"local-event-backend/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type analyticsRepository struct {
	db *pgxpool.Pool
}

// NewAnalyticsRepository builds a Postgres-backed AnalyticsRepository.
func NewAnalyticsRepository(db *pgxpool.Pool) domain.AnalyticsRepository {
	return &analyticsRepository{db: db}
}

func (r *analyticsRepository) Get(ctx context.Context) (*domain.Analytics, error) {
	a := &domain.Analytics{}

	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&a.TotalUsers); err != nil {
		return nil, err
	}

	// Tickets sold = quantity of completed orders.
	if err := r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE status = 'completed'`,
	).Scan(&a.TotalTicketsSold); err != nil {
		return nil, err
	}

	// Sold tickets grouped per category (all categories, zero-filled).
	const byCategory = `
		SELECT c.id, c.name, COALESCE(SUM(o.quantity), 0) AS sold
		FROM categories c
		LEFT JOIN events e   ON e.category_id = c.id
		LEFT JOIN tickets tk ON tk.event_id = e.id
		LEFT JOIN orders o   ON o.ticket_id = tk.id AND o.status = 'completed'
		GROUP BY c.id, c.name
		ORDER BY sold DESC, c.name ASC`
	rows, err := r.db.Query(ctx, byCategory)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var cs domain.CategorySales
		if err := rows.Scan(&cs.CategoryID, &cs.CategoryName, &cs.TicketsSold); err != nil {
			return nil, err
		}
		a.SalesByCategory = append(a.SalesByCategory, cs)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(a.SalesByCategory) > 0 && a.SalesByCategory[0].TicketsSold > 0 {
		a.TopCategory = &a.SalesByCategory[0]
	}
	return a, nil
}
