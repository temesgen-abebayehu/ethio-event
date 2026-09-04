package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"local-event-backend/domain"
)

func TestPasswordResetRepository(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewPasswordResetRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "reset@e.com")

	pr := &domain.PasswordReset{UserID: user.ID, TokenHash: "hash-1", ExpiresAt: time.Now().Add(time.Hour)}
	if err := repo.Create(ctx, pr); err != nil {
		t.Fatalf("Create: %v", err)
	}

	found, err := repo.FindValidByHash(ctx, "hash-1")
	if err != nil || found.UserID != user.ID {
		t.Fatalf("FindValidByHash = %+v, %v", found, err)
	}

	if err := repo.MarkUsed(ctx, found.ID); err != nil {
		t.Fatalf("MarkUsed: %v", err)
	}

	// Once used, it is no longer valid.
	if _, err := repo.FindValidByHash(ctx, "hash-1"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("used token error = %v; want ErrNotFound", err)
	}
}

func TestPasswordResetRepository_Expired(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewPasswordResetRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "reset2@e.com")
	pr := &domain.PasswordReset{UserID: user.ID, TokenHash: "hash-2", ExpiresAt: time.Now().Add(-time.Hour)}
	if err := repo.Create(ctx, pr); err != nil {
		t.Fatalf("Create: %v", err)
	}

	if _, err := repo.FindValidByHash(ctx, "hash-2"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("expired token error = %v; want ErrNotFound", err)
	}
}
