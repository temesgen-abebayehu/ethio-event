-- Seed default categories.
INSERT INTO categories (name, slug) VALUES
    ('Music', 'music'),
    ('Sports', 'sports'),
    ('Business', 'business'),
    ('Arts', 'arts'),
    ('Food', 'food'),
    ('Technology', 'technology'),
    ('Education', 'education'),
    ('Community', 'community')
ON CONFLICT (name) DO NOTHING;
