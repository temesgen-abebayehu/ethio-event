package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"local-event-backend/domain"
	"local-event-backend/repository/dto"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type eventRepository struct {
	db *pgxpool.Pool
}

// NewEventRepository builds a Postgres-backed EventRepository.
func NewEventRepository(db *pgxpool.Pool) domain.EventRepository {
	return &eventRepository{db: db}
}

// sortColumns whitelists the columns events may be ordered by.
var sortColumns = map[string]string{
	"event_date": "e.event_date",
	"price":      "e.price",
	"created_at": "e.created_at",
}

// buildWhere assembles the WHERE clause and its arguments from a filter.
func buildWhere(f domain.EventFilter) (string, []interface{}) {
	var conds []string
	var args []interface{}
	add := func(cond string, val interface{}) {
		args = append(args, val)
		conds = append(conds, fmt.Sprintf(cond, len(args)))
	}

	if f.PublicOnly {
		conds = append(conds, "e.status = 'published'")
	}
	if f.OrganizerID != "" {
		add("e.user_id = $%d", f.OrganizerID)
	}
	if f.CategoryID != "" {
		add("e.category_id = $%d", f.CategoryID)
	}
	if f.MinPrice != nil {
		add("e.price >= $%d", *f.MinPrice)
	}
	if f.MaxPrice != nil {
		add("e.price <= $%d", *f.MaxPrice)
	}
	if f.FreeOnly {
		conds = append(conds, "e.price = 0")
	}
	if f.DateFrom != nil {
		add("e.event_date >= $%d", *f.DateFrom)
	}
	if f.DateTo != nil {
		add("e.event_date <= $%d", *f.DateTo)
	}
	// Free-text search across title, description, venue, address and tags.
	// Every word must match somewhere, so tag-only matches still return results.
	for _, word := range strings.Fields(f.Search) {
		args = append(args, "%"+word+"%")
		n := len(args)
		conds = append(conds, fmt.Sprintf(`(
			e.title ILIKE $%d OR e.description ILIKE $%d OR e.venue ILIKE $%d OR e.address ILIKE $%d
			OR EXISTS (SELECT 1 FROM event_tags et JOIN tags t ON t.id = et.tag_id
			           WHERE et.event_id = e.id AND t.name ILIKE $%d)
		)`, n, n, n, n, n))
	}

	if len(conds) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}

func (r *eventRepository) List(ctx context.Context, f domain.EventFilter) ([]domain.Event, int, error) {
	where, args := buildWhere(f)

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM events e"+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	col := sortColumns[f.Sort]
	if col == "" {
		col = "e.event_date"
	}
	order := "ASC"
	if strings.EqualFold(f.Order, "desc") {
		order = "DESC"
	}
	limit := f.Limit
	if limit <= 0 {
		limit = 12
	}

	args = append(args, limit, f.Offset)
	q := fmt.Sprintf("SELECT %s FROM events e%s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		eventJSONExpr, where, col, order, len(args)-1, len(args))

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	events := []domain.Event{}
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, 0, err
		}
		var row dto.EventRow
		if err := json.Unmarshal(raw, &row); err != nil {
			return nil, 0, err
		}
		events = append(events, row.ToDomain())
	}
	return events, total, rows.Err()
}

func (r *eventRepository) FindByIDOrSlug(ctx context.Context, idOrSlug string, publicOnly bool) (*domain.Event, error) {
	cond := "(e.id::text = $1 OR e.slug = $1)"
	if publicOnly {
		cond += " AND e.status = 'published'"
	}
	q := fmt.Sprintf("SELECT %s FROM events e WHERE %s", eventJSONExpr, cond)

	var raw []byte
	err := r.db.QueryRow(ctx, q, idOrSlug).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	var row dto.EventRow
	if err := json.Unmarshal(raw, &row); err != nil {
		return nil, err
	}
	ev := row.ToDomain()
	return &ev, nil
}

func (r *eventRepository) Create(ctx context.Context, userID string, in domain.EventInput) (*domain.Event, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	status := in.Status
	if status == "" {
		status = domain.EventPublished
	}

	var eventID string
	const insertEvent = `
		INSERT INTO events (user_id, category_id, title, description, venue, address,
		                    latitude, longitude, price, event_date, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id`
	err = tx.QueryRow(ctx, insertEvent,
		userID, in.CategoryID, in.Title, in.Description, in.Venue, in.Address,
		in.Latitude, in.Longitude, in.Price, in.EventDate, status,
	).Scan(&eventID)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO tickets (event_id, price, quantity_total) VALUES ($1, $2, $3)`,
		eventID, in.Price, in.TicketQuantity,
	); err != nil {
		return nil, err
	}

	if err := replaceTags(ctx, tx, eventID, in.Tags); err != nil {
		return nil, err
	}
	if err := insertImages(ctx, tx, eventID, in.Images); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.FindByIDOrSlug(ctx, eventID, false)
}

func (r *eventRepository) Update(ctx context.Context, id string, in domain.EventInput) (*domain.Event, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	const updateEvent = `
		UPDATE events
		SET category_id=$2, title=$3, description=$4, venue=$5, address=$6,
		    latitude=$7, longitude=$8, price=$9, event_date=$10, status=COALESCE(NULLIF($11,''), status)
		WHERE id=$1`
	tag, err := tx.Exec(ctx, updateEvent,
		id, in.CategoryID, in.Title, in.Description, in.Venue, in.Address,
		in.Latitude, in.Longitude, in.Price, in.EventDate, in.Status,
	)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, domain.ErrNotFound
	}

	// Keep the ticket template in sync with the event's price and capacity.
	if _, err := tx.Exec(ctx, `
		INSERT INTO tickets (event_id, price, quantity_total) VALUES ($1, $2, $3)
		ON CONFLICT (event_id) DO UPDATE SET price = EXCLUDED.price, quantity_total = EXCLUDED.quantity_total`,
		id, in.Price, in.TicketQuantity,
	); err != nil {
		return nil, err
	}

	if err := replaceTags(ctx, tx, id, in.Tags); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM event_images WHERE event_id = $1`, id); err != nil {
		return nil, err
	}
	if err := insertImages(ctx, tx, id, in.Images); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.FindByIDOrSlug(ctx, id, false)
}

func (r *eventRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM events WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *eventRepository) Nearby(ctx context.Context, lat, lng, radiusKM float64) ([]domain.NearbyEvent, error) {
	rows, err := r.db.Query(ctx,
		`SELECT event_id, distance_km FROM get_nearby_events($1, $2, $3)`, lat, lng, radiusKM)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.NearbyEvent
	for rows.Next() {
		var n domain.NearbyEvent
		if err := rows.Scan(&n.EventID, &n.DistanceKM); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

// replaceTags upserts tag names and rewrites an event's tag links.
func replaceTags(ctx context.Context, tx pgx.Tx, eventID string, tags []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM event_tags WHERE event_id = $1`, eventID); err != nil {
		return err
	}
	for _, name := range tags {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		var tagID string
		if err := tx.QueryRow(ctx,
			`INSERT INTO tags (name) VALUES ($1)
			 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, name,
		).Scan(&tagID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO event_tags (event_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			eventID, tagID,
		); err != nil {
			return err
		}
	}
	return nil
}

// insertImages writes an event's images.
func insertImages(ctx context.Context, tx pgx.Tx, eventID string, images []domain.EventImage) error {
	for _, img := range images {
		if _, err := tx.Exec(ctx,
			`INSERT INTO event_images (event_id, url, public_id, is_featured) VALUES ($1, $2, $3, $4)`,
			eventID, img.URL, img.PublicID, img.IsFeatured,
		); err != nil {
			return err
		}
	}
	return nil
}
