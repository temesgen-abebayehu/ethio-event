package domain

// Category is an admin-managed event category.
type Category struct {
	ID          string
	Name        string
	Slug        string
	Description *string
	Icon        *string
	Color       *string
	IsActive    bool
	EventCount  int // usage count, populated on list
}
