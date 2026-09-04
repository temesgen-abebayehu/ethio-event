package repository

import (
	"context"
	"errors"
	"testing"

	"local-event-backend/domain"
)

func TestUserRepository(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewUserRepository(testPool)
	ctx := context.Background()

	u, err := repo.Create(ctx, &domain.User{Email: "a@e.com", PasswordHash: "h", FullName: "A B", Role: domain.RoleUser})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if u.ID == "" || u.Role != domain.RoleUser {
		t.Fatalf("Create returned %+v", u)
	}

	if _, err := repo.Create(ctx, &domain.User{Email: "a@e.com", PasswordHash: "h", FullName: "Dup"}); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("duplicate email error = %v; want ErrConflict", err)
	}

	byEmail, err := repo.FindByEmail(ctx, "a@e.com")
	if err != nil || byEmail.ID != u.ID {
		t.Fatalf("FindByEmail = %+v, %v", byEmail, err)
	}

	byID, err := repo.FindByID(ctx, u.ID)
	if err != nil || byID.Email != "a@e.com" {
		t.Fatalf("FindByID = %+v, %v", byID, err)
	}

	if err := repo.UpdatePassword(ctx, u.ID, "newhash"); err != nil {
		t.Fatalf("UpdatePassword: %v", err)
	}
	reloaded, _ := repo.FindByEmail(ctx, "a@e.com")
	if reloaded.PasswordHash != "newhash" {
		t.Errorf("password not updated: %q", reloaded.PasswordHash)
	}

	if _, err := repo.FindByID(ctx, "00000000-0000-0000-0000-000000000000"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("missing user error = %v; want ErrNotFound", err)
	}
}
