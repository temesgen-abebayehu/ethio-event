package usecase

import (
	"context"
	"testing"

	"local-event-backend/domain"
)

func TestAnalyticsUsecase_Get(t *testing.T) {
	repo := &fakeAnalyticsRepo{analytics: &domain.Analytics{TotalUsers: 5, TotalTicketsSold: 12}}
	uc := NewAnalyticsUsecase(repo)

	a, err := uc.Get(context.Background())
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if a.TotalUsers != 5 || a.TotalTicketsSold != 12 {
		t.Errorf("analytics = %+v; want users=5 tickets=12", a)
	}
}
