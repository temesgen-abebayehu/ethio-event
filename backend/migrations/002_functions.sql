-- Functions and triggers for LocalEvents.

-- Keep updated_at fresh on row updates.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-generate a unique slug from the event title.
CREATE OR REPLACE FUNCTION generate_event_slug(title TEXT, event_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
BEGIN
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    RETURN base_slug || '-' || substring(event_id::TEXT FROM 1 FOR 8);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION events_set_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title <> NEW.title) THEN
        NEW.slug := generate_event_slug(NEW.title, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_slug
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION events_set_slug();

-- Adjust a ticket's sold count as orders complete or refund.
CREATE OR REPLACE FUNCTION orders_sync_quantity_sold()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'completed')
       OR (TG_OP = 'UPDATE' AND OLD.status <> 'completed' AND NEW.status = 'completed') THEN
        UPDATE tickets SET quantity_sold = quantity_sold + NEW.quantity WHERE id = NEW.ticket_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status = 'refunded' THEN
        UPDATE tickets SET quantity_sold = quantity_sold - OLD.quantity WHERE id = NEW.ticket_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_quantity_sold
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION orders_sync_quantity_sold();

-- Nearby events via the Haversine formula.
CREATE OR REPLACE FUNCTION get_nearby_events(lat DECIMAL, lng DECIMAL, radius_km DECIMAL DEFAULT 10)
RETURNS TABLE (event_id UUID, distance_km DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id,
           ROUND(CAST(
               6371 * acos(
                   cos(radians(lat)) * cos(radians(e.latitude)) *
                   cos(radians(e.longitude) - radians(lng)) +
                   sin(radians(lat)) * sin(radians(e.latitude))
               ) AS NUMERIC), 2) AS distance_km
    FROM events e
    WHERE 6371 * acos(
              cos(radians(lat)) * cos(radians(e.latitude)) *
              cos(radians(e.longitude) - radians(lng)) +
              sin(radians(lat)) * sin(radians(e.latitude))
          ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
