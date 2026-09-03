package domain

// CategorySales is the ticket total sold for one category.
type CategorySales struct {
	CategoryID   string
	CategoryName string
	TicketsSold  int
}

// Analytics is the admin dashboard aggregate.
type Analytics struct {
	TotalUsers       int
	TotalTicketsSold int
	SalesByCategory  []CategorySales
	TopCategory      *CategorySales
}
