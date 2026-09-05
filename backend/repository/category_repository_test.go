package repository

import (
	"context"
	"errors"
	"testing"

	"local-event-backend/domain"
)

func TestCategoryRepository(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewCategoryRepository(testPool)
	ctx := context.Background()

	seeded, err := repo.List(ctx, true)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(seeded) == 0 {
		t.Fatal("expected seeded categories")
	}

	desc := "Live shows"
	created, err := repo.Create(ctx, &domain.Category{Name: "Concerts", Slug: "concerts", Description: &desc, IsActive: true})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if _, err := repo.Create(ctx, &domain.Category{Name: "Concerts", Slug: "concerts2", IsActive: true}); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("duplicate name error = %v; want ErrConflict", err)
	}

	found, err := repo.FindByID(ctx, created.ID)
	if err != nil || found.Name != "Concerts" {
		t.Fatalf("FindByID = %+v, %v", found, err)
	}

	created.Name = "Concerts & Gigs"
	if _, err := repo.Update(ctx, created); err != nil {
		t.Fatalf("Update: %v", err)
	}

	if err := repo.SetActive(ctx, created.ID, false); err != nil {
		t.Fatalf("SetActive: %v", err)
	}
	active, _ := repo.List(ctx, true)
	all, _ := repo.List(ctx, false)
	if len(all) <= len(active) {
		t.Error("deactivated category should be hidden from active-only list")
	}

	if n, err := repo.CountEvents(ctx, created.ID); err != nil || n != 0 {
		t.Errorf("CountEvents = %d, %v; want 0", n, err)
	}

	if err := repo.Delete(ctx, created.ID); err != nil {
		t.Fatalf("Delete unused: %v", err)
	}
}

func TestCategoryRepository_DeleteInUse(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewCategoryRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "owner@e.com")
	ev := seedEvent(t, user.ID, 0, 10)

	if err := repo.Delete(ctx, ev.CategoryID); !errors.Is(err, domain.ErrCategoryInUse) {
		t.Errorf("Delete in-use error = %v; want ErrCategoryInUse", err)
	}
}
