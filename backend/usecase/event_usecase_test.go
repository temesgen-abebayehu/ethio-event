package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"local-event-backend/domain"
)

func validEventInput() domain.EventInput {
	return domain.EventInput{
		Title:          "Addis Jazz Night",
		Description:    "A great night",
		CategoryID:     "cat-1",
		Venue:          "Ghion",
		Address:        "Addis",
		EventDate:      time.Now().Add(48 * time.Hour),
		Price:          100,
		TicketQuantity: 50,
		Tags:           []string{"jazz"},
		Images:         []domain.EventImage{{URL: "u", PublicID: "p", IsFeatured: true}},
	}
}

func activeCategoryRepo() *fakeCategoryRepo {
	return &fakeCategoryRepo{category: &domain.Category{ID: "cat-1", IsActive: true}}
}

func TestEventUsecase_Create_Valid(t *testing.T) {
	uc := NewEventUsecase(&fakeEventRepo{}, activeCategoryRepo())
	ev, err := uc.Create(context.Background(), "user-1", validEventInput())
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if ev.ID == "" {
		t.Error("Create() returned event without ID")
	}
}

func TestEventUsecase_Create_Validation(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*domain.EventInput)
	}{
		{"short title", func(in *domain.EventInput) { in.Title = "Ab" }},
		{"no featured image", func(in *domain.EventInput) { in.Images[0].IsFeatured = false }},
		{"no images", func(in *domain.EventInput) { in.Images = nil }},
		{"past date", func(in *domain.EventInput) { in.EventDate = time.Now().Add(-48 * time.Hour) }},
		{"zero tickets", func(in *domain.EventInput) { in.TicketQuantity = 0 }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := NewEventUsecase(&fakeEventRepo{}, activeCategoryRepo())
			in := validEventInput()
			tt.mutate(&in)
			if _, err := uc.Create(context.Background(), "user-1", in); !errors.Is(err, domain.ErrInvalidInput) {
				t.Errorf("Create() error = %v; want ErrInvalidInput", err)
			}
		})
	}
}

func TestEventUsecase_Update_NonOwnerForbidden(t *testing.T) {
	repo := &fakeEventRepo{event: &domain.Event{ID: "event-1", UserID: "owner", Status: domain.EventPublished}}
	uc := NewEventUsecase(repo, activeCategoryRepo())

	_, err := uc.Update(context.Background(), "intruder", domain.RoleUser, "event-1", validEventInput())
	if !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("Update() error = %v; want ErrForbidden", err)
	}
}

func TestEventUsecase_Delete_AdminAllowed(t *testing.T) {
	repo := &fakeEventRepo{event: &domain.Event{ID: "event-1", UserID: "owner"}}
	uc := NewEventUsecase(repo, activeCategoryRepo())

	if err := uc.Delete(context.Background(), "someone", domain.RoleAdmin, "event-1"); err != nil {
		t.Fatalf("Delete() error = %v; want nil for admin", err)
	}
	if !repo.deleted {
		t.Error("admin delete did not remove the event")
	}
}
