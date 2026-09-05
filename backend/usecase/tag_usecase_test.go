package usecase

import (
	"context"
	"testing"

	"local-event-backend/domain"
)

func TestTagUsecase_List(t *testing.T) {
	repo := &fakeTagRepo{tags: []domain.Tag{{ID: "1", Name: "jazz"}, {ID: "2", Name: "tech"}}}
	uc := NewTagUsecase(repo)

	tags, err := uc.List(context.Background())
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(tags) != 2 {
		t.Errorf("len(tags) = %d; want 2", len(tags))
	}
}
