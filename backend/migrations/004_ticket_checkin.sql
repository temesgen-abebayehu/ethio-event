-- Ticket check-in: track when and by whom an order's tickets were scanned at the door.
ALTER TABLE orders ADD COLUMN scanned_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN scanned_by UUID REFERENCES users(id) ON DELETE SET NULL;
