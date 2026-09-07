package usecase

import (
	"context"

	"local-event-backend/domain"
)

// AnalyticsUsecase exposes platform-wide admin metrics.
type AnalyticsUsecase struct {
	analytics domain.AnalyticsRepository
}

// NewAnalyticsUsecase wires the analytics usecase.
func NewAnalyticsUsecase(analytics domain.AnalyticsRepository) *AnalyticsUsecase {
	return &AnalyticsUsecase{analytics: analytics}
}

// Get returns the aggregated admin dashboard metrics.
func (u *AnalyticsUsecase) Get(ctx context.Context) (*domain.Analytics, error) {
	return u.analytics.Get(ctx)
}
