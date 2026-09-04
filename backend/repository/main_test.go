package repository

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"local-event-backend/domain"
	"local-event-backend/infrastructure/database"

	"github.com/jackc/pgx/v5/pgxpool"
)

// testPool is shared by all repository integration tests. It is nil (and tests
// skip) unless TEST_DATABASE_URL points at a reachable Postgres instance.
var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url != "" {
		pool, err := database.New(url)
		if err != nil {
			fmt.Printf("repository tests: cannot connect: %v\n", err)
			os.Exit(1)
		}
		if err := resetSchema(pool); err != nil {
			fmt.Printf("repository tests: schema setup failed: %v\n", err)
			os.Exit(1)
		}
		testPool = pool
	}
	code := m.Run()
	if testPool != nil {
		testPool.Close()
	}
	os.Exit(code)
}

// resetSchema drops and recreates the schema, then applies the migrations.
func resetSchema(pool *pgxpool.Pool) error {
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`); err != nil {
		return err
	}
	for _, f := range []string{"001_schema.sql", "002_functions.sql", "003_seed.sql"} {
		b, err := os.ReadFile(filepath.Join("..", "migrations", f))
		if err != nil {
			return err
		}
		if _, err := pool.Exec(ctx, string(b)); err != nil {
			return fmt.Errorf("%s: %w", f, err)
		}
	}
	return nil
}

// requireDB skips the test unless the integration database is configured.
func requireDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	if testPool == nil {
		t.Skip("set TEST_DATABASE_URL to run repository integration tests")
	}
	return testPool
}

// resetData clears all mutable tables (categories stay seeded) for isolation.
func resetData(t *testing.T) {
	t.Helper()
	_, err := testPool.Exec(context.Background(),
		`TRUNCATE users, events, event_images, event_tags, tags, bookmarks, follows, tickets, orders, password_resets RESTART IDENTITY CASCADE`)
	if err != nil {
		t.Fatalf("resetData: %v", err)
	}
}

// anyCategoryID returns a seeded category id.
func anyCategoryID(t *testing.T) string {
	t.Helper()
	var id string
	if err := testPool.QueryRow(context.Background(), `SELECT id FROM categories LIMIT 1`).Scan(&id); err != nil {
		t.Fatalf("anyCategoryID: %v", err)
	}
	return id
}

// seedUser inserts a user via the repository and returns it.
func seedUser(t *testing.T, email string) *domain.User {
	t.Helper()
	u, err := NewUserRepository(testPool).Create(context.Background(), &domain.User{
		Email: email, PasswordHash: "hash", FullName: "Test User", Role: domain.RoleUser,
	})
	if err != nil {
		t.Fatalf("seedUser: %v", err)
	}
	return u
}

// seedEvent inserts an event (with a ticket) via the repository and returns it.
func seedEvent(t *testing.T, userID string, price float64, qty int) *domain.Event {
	t.Helper()
	ev, err := NewEventRepository(testPool).Create(context.Background(), userID, domain.EventInput{
		Title:          "Addis Jazz Night",
		Description:    "desc",
		CategoryID:     anyCategoryID(t),
		Venue:          "Ghion",
		Address:        "Addis",
		Latitude:       9.0,
		Longitude:      38.7,
		Price:          price,
		EventDate:      timeFuture(),
		TicketQuantity: qty,
		Tags:           []string{"jazz"},
		Images:         []domain.EventImage{{URL: "u", PublicID: "p", IsFeatured: true}},
		Status:         domain.EventPublished,
	})
	if err != nil {
		t.Fatalf("seedEvent: %v", err)
	}
	return ev
}

// timeFuture returns a timestamp two days ahead, for valid event dates.
func timeFuture() time.Time {
	return time.Now().Add(48 * time.Hour)
}
