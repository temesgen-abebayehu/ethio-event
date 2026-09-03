-- LocalEvents schema (final state). Apply in order: 001 → 002 → 003.

-- ============================ Users ============================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens (time-limited, single-use).
CREATE TABLE password_resets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- ========================== Categories =========================
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon        VARCHAR(50),
    color       VARCHAR(20),
    is_active   BOOLEAN NOT NULL DEFAULT true
);

-- ============================ Events ============================
CREATE TABLE events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   UUID NOT NULL REFERENCES categories(id),
    title         VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    venue         VARCHAR(255) NOT NULL,
    address       TEXT NOT NULL,
    latitude      DECIMAL(10, 8) NOT NULL,
    longitude     DECIMAL(11, 8) NOT NULL,
    price         DECIMAL(10, 2) NOT NULL DEFAULT 0,
    event_date    TIMESTAMPTZ NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    slug          TEXT UNIQUE,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_search ON events USING GIN(search_vector);

-- Event images.
CREATE TABLE event_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    public_id   VARCHAR(255) NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_event_images_event_id ON event_images(event_id);

-- Tags + event↔tag join.
CREATE TABLE tags (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE event_tags (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag_id   UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);
CREATE INDEX idx_event_tags_tag_id ON event_tags(tag_id);

-- Bookmarks + follows.
CREATE TABLE bookmarks (
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, event_id)
);
CREATE INDEX idx_bookmarks_event_id ON bookmarks(event_id);

CREATE TABLE follows (
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, event_id)
);
CREATE INDEX idx_follows_event_id ON follows(event_id);

-- ====================== Tickets & orders =======================
CREATE TABLE tickets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id       UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    price          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity_total INTEGER NOT NULL,
    quantity_sold  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT check_quantity_sold CHECK (quantity_sold <= quantity_total)
);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);

CREATE TABLE orders (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id    UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 1,
    total_price  DECIMAL(10, 2) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    chapa_tx_ref VARCHAR(255) UNIQUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_ticket_id ON orders(ticket_id);
CREATE INDEX idx_orders_tx_ref ON orders(chapa_tx_ref);
