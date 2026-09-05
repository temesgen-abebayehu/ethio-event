package dto

import "local-event-backend/domain"

// CategoryRequest is the body for creating or updating a category.
type CategoryRequest struct {
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	Color       *string `json:"color"`
	IsActive    *bool   `json:"is_active"`
}

// ToDomain maps the request into a domain category (id set by caller).
func (r CategoryRequest) ToDomain() domain.Category {
	active := true
	if r.IsActive != nil {
		active = *r.IsActive
	}
	return domain.Category{
		Name: r.Name, Slug: r.Slug, Description: r.Description,
		Icon: r.Icon, Color: r.Color, IsActive: active,
	}
}

// SetActiveRequest toggles a category's active status.
type SetActiveRequest struct {
	IsActive bool `json:"is_active"`
}

// NewCategoryList maps domain categories to response DTOs.
func NewCategoryList(cats []domain.Category) []CategoryResponse {
	out := make([]CategoryResponse, 0, len(cats))
	for _, c := range cats {
		out = append(out, NewCategoryResponse(c))
	}
	return out
}

// NewTagList maps domain tags to response DTOs.
func NewTagList(tags []domain.Tag) []TagResponse {
	out := make([]TagResponse, 0, len(tags))
	for _, t := range tags {
		out = append(out, TagResponse{ID: t.ID, Name: t.Name})
	}
	return out
}
