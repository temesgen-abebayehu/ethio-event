package usecase

import (
	"context"
	"testing"

	"local-event-backend/domain"
)

func TestInteractionUsecase_Actions(t *testing.T) {
	repo := &fakeInteractionRepo{}
	uc := NewInteractionUsecase(repo)
	ctx := context.Background()

	if err := uc.Bookmark(ctx, "u", "e"); err != nil {
		t.Fatalf("Bookmark error: %v", err)
	}
	if err := uc.RemoveBookmark(ctx, "u", "e"); err != nil {
		t.Fatalf("RemoveBookmark error: %v", err)
	}
	if err := uc.Follow(ctx, "u", "e"); err != nil {
		t.Fatalf("Follow error: %v", err)
	}
	if err := uc.Unfollow(ctx, "u", "e"); err != nil {
		t.Fatalf("Unfollow error: %v", err)
	}

	for _, name := range []string{"AddBookmark", "RemoveBookmark", "AddFollow", "RemoveFollow"} {
		if repo.calls[name] != 1 {
			t.Errorf("%s called %d times; want 1", name, repo.calls[name])
		}
	}
}

func TestInteractionUsecase_Status(t *testing.T) {
	repo := &fakeInteractionRepo{bookmarked: true, following: false}
	uc := NewInteractionUsecase(repo)

	b, f, err := uc.Status(context.Background(), "u", "e")
	if err != nil {
		t.Fatalf("Status error: %v", err)
	}
	if !b || f {
		t.Errorf("Status = (%v,%v); want (true,false)", b, f)
	}
}

func TestInteractionUsecase_Lists(t *testing.T) {
	repo := &fakeInteractionRepo{events: []domain.Event{{ID: "e1"}}}
	uc := NewInteractionUsecase(repo)

	bm, err := uc.Bookmarks(context.Background(), "u")
	if err != nil || len(bm) != 1 {
		t.Fatalf("Bookmarks = %v, %v", bm, err)
	}
	fl, err := uc.Follows(context.Background(), "u")
	if err != nil || len(fl) != 1 {
		t.Fatalf("Follows = %v, %v", fl, err)
	}
}
