package repository

import (
	"context"
	"testing"
)

func TestInteractionRepository(t *testing.T) {
	requireDB(t)
	resetData(t)
	repo := NewInteractionRepository(testPool)
	ctx := context.Background()

	user := seedUser(t, "fan@e.com")
	ev := seedEvent(t, user.ID, 0, 10)

	if err := repo.AddBookmark(ctx, user.ID, ev.ID); err != nil {
		t.Fatalf("AddBookmark: %v", err)
	}
	if err := repo.AddFollow(ctx, user.ID, ev.ID); err != nil {
		t.Fatalf("AddFollow: %v", err)
	}

	// Idempotent: adding again must not error.
	if err := repo.AddBookmark(ctx, user.ID, ev.ID); err != nil {
		t.Fatalf("AddBookmark (again): %v", err)
	}

	bookmarked, following, err := repo.Status(ctx, user.ID, ev.ID)
	if err != nil {
		t.Fatalf("Status: %v", err)
	}
	if !bookmarked || !following {
		t.Errorf("status = (%v,%v); want (true,true)", bookmarked, following)
	}

	bm, err := repo.ListBookmarkedEvents(ctx, user.ID)
	if err != nil || len(bm) != 1 {
		t.Fatalf("ListBookmarkedEvents = %v, %v", bm, err)
	}
	fl, err := repo.ListFollowedEvents(ctx, user.ID)
	if err != nil || len(fl) != 1 {
		t.Fatalf("ListFollowedEvents = %v, %v", fl, err)
	}

	if err := repo.RemoveBookmark(ctx, user.ID, ev.ID); err != nil {
		t.Fatalf("RemoveBookmark: %v", err)
	}
	if err := repo.RemoveFollow(ctx, user.ID, ev.ID); err != nil {
		t.Fatalf("RemoveFollow: %v", err)
	}
	bookmarked, following, _ = repo.Status(ctx, user.ID, ev.ID)
	if bookmarked || following {
		t.Errorf("after removal status = (%v,%v); want (false,false)", bookmarked, following)
	}
}
