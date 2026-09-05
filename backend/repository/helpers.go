package repository

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// isUniqueViolation reports whether err is a Postgres unique-constraint error.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

// isForeignKeyViolation reports whether err is a Postgres FK-constraint error.
func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23503"
	}
	return false
}

// eventJSONExpr is the shared json_build_object projection used to load an
// event together with its category, images, tags and ticket in one row.
const eventJSONExpr = `
	json_build_object(
		'id', e.id, 'slug', e.slug, 'user_id', e.user_id, 'category_id', e.category_id,
		'title', e.title, 'description', e.description, 'venue', e.venue, 'address', e.address,
		'latitude', e.latitude, 'longitude', e.longitude, 'price', e.price,
		'event_date', e.event_date, 'status', e.status, 'created_at', e.created_at, 'updated_at', e.updated_at,
		'organizer_name', (SELECT u.full_name FROM users u WHERE u.id = e.user_id),
		'category', (SELECT json_build_object(
			'id', c.id, 'name', c.name, 'slug', c.slug,
			'description', c.description, 'icon', c.icon, 'color', c.color, 'is_active', c.is_active
		) FROM categories c WHERE c.id = e.category_id),
		'images', COALESCE((SELECT json_agg(json_build_object(
			'id', ei.id, 'url', ei.url, 'public_id', ei.public_id, 'is_featured', ei.is_featured
		) ORDER BY ei.is_featured DESC) FROM event_images ei WHERE ei.event_id = e.id), '[]'::json),
		'tags', COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
			FROM event_tags et JOIN tags t ON t.id = et.tag_id WHERE et.event_id = e.id), '[]'::json),
		'ticket', (SELECT json_build_object(
			'id', tk.id, 'price', tk.price, 'quantity_total', tk.quantity_total, 'quantity_sold', tk.quantity_sold
		) FROM tickets tk WHERE tk.event_id = e.id LIMIT 1)
	)`
