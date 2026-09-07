package controller

import (
	"net/http"

	"local-event-backend/delivery/controller/dto"
	"local-event-backend/domain"
)

// AnalyticsController exposes the admin analytics dashboard.
type AnalyticsController struct {
	analytics domain.AnalyticsUsecase
}

// NewAnalyticsController builds an AnalyticsController.
func NewAnalyticsController(analytics domain.AnalyticsUsecase) *AnalyticsController {
	return &AnalyticsController{analytics: analytics}
}

// Get handles GET /api/admin/analytics.
func (c *AnalyticsController) Get(w http.ResponseWriter, r *http.Request) {
	a, err := c.analytics.Get(r.Context())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.NewAnalyticsResponse(a))
}
