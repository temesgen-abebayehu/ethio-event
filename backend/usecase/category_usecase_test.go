package usecase

import (
	"context"
	"errors"
	"testing"

	"local-event-backend/domain"
)

func TestCategoryUsecase_Delete_InUse(t *testing.T) {
	repo := &fakeCategoryRepo{eventCount: 3}
	uc := NewCategoryUsecase(repo)

	err := uc.Delete(context.Background(), "cat-1")
	if !errors.Is(err, domain.ErrCategoryInUse) {
		t.Errorf("Delete() error = %v; want ErrCategoryInUse", err)
	}
	if repo.deleted {
		t.Error("category was hard-deleted while in use")
	}
}

func TestCategoryUsecase_Delete_Unused(t *testing.T) {
	repo := &fakeCategoryRepo{eventCount: 0}
	uc := NewCategoryUsecase(repo)

	if err := uc.Delete(context.Background(), "cat-1"); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if !repo.deleted {
		t.Error("unused category was not deleted")
	}
}

func TestCategoryUsecase_Create_NameValidation(t *testing.T) {
	uc := NewCategoryUsecase(&fakeCategoryRepo{})
	_, err := uc.Create(context.Background(), &domain.Category{Name: "A"})
	if !errors.Is(err, domain.ErrInvalidInput) {
		t.Errorf("Create() error = %v; want ErrInvalidInput", err)
	}
}
