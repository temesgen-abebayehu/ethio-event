package dto

import "local-event-backend/domain"

// InitiatePaymentRequest is the body for POST /api/payments/initiate.
type InitiatePaymentRequest struct {
	EventID  string `json:"event_id"`
	Quantity int    `json:"quantity"`
}

// InitiatePaymentResponse is returned when a purchase starts.
type InitiatePaymentResponse struct {
	CheckoutURL string  `json:"checkout_url,omitempty"`
	TxRef       string  `json:"tx_ref"`
	TotalPrice  float64 `json:"total_price"`
	OrderID     string  `json:"order_id"`
	Status      string  `json:"status"`
}

// VerifyPaymentRequest is the body for POST /api/payments/verify.
type VerifyPaymentRequest struct {
	TxRef string `json:"tx_ref"`
}

// ScanTicketRequest is the body for POST /api/tickets/scan.
type ScanTicketRequest struct {
	Code string `json:"code"`
}

// ScanResultResponse is returned after a successful ticket check-in.
type ScanResultResponse struct {
	OrderID    string `json:"order_id"`
	BuyerName  string `json:"buyer_name"`
	EventTitle string `json:"event_title"`
	Quantity   int    `json:"quantity"`
	ScannedAt  string `json:"scanned_at"`
}

// NotifyBuyersRequest is the body for POST /api/events/{id}/notify.
type NotifyBuyersRequest struct {
	Recipients []string `json:"recipients"`
	Subject    string   `json:"subject"`
	Body       string   `json:"body"`
}

// NewScanResultResponse maps a domain scan result to its response DTO.
func NewScanResultResponse(s *domain.ScanResult) ScanResultResponse {
	return ScanResultResponse{
		OrderID: s.OrderID, BuyerName: s.BuyerName, EventTitle: s.EventTitle,
		Quantity: s.Quantity, ScannedAt: s.ScannedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// OrderResponse is the wire representation of an order/ticket purchase.
type OrderResponse struct {
	ID         string         `json:"id"`
	Quantity   int            `json:"quantity"`
	TotalPrice float64        `json:"total_price"`
	Status     string         `json:"status"`
	ChapaTxRef string         `json:"chapa_tx_ref"`
	ScannedAt  *string        `json:"scanned_at"`
	CreatedAt  string         `json:"created_at"`
	Event      *EventResponse `json:"event,omitempty"`
}

// NewInitiatePaymentResponse maps a domain result to its response DTO.
func NewInitiatePaymentResponse(r *domain.InitiateResult) InitiatePaymentResponse {
	return InitiatePaymentResponse{
		CheckoutURL: r.CheckoutURL, TxRef: r.TxRef, TotalPrice: r.TotalPrice,
		OrderID: r.OrderID, Status: r.Status,
	}
}

// NewOrderResponse maps a domain order to its response DTO.
func NewOrderResponse(o domain.Order) OrderResponse {
	resp := OrderResponse{
		ID: o.ID, Quantity: o.Quantity, TotalPrice: o.TotalPrice,
		Status: o.Status, ChapaTxRef: o.ChapaTxRef, CreatedAt: o.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if o.ScannedAt != nil {
		s := o.ScannedAt.Format("2006-01-02T15:04:05Z07:00")
		resp.ScannedAt = &s
	}
	if o.Event != nil {
		ev := NewEventResponse(*o.Event)
		resp.Event = &ev
	}
	return resp
}

// NewOrderList maps domain orders to response DTOs.
func NewOrderList(orders []domain.Order) []OrderResponse {
	out := make([]OrderResponse, 0, len(orders))
	for _, o := range orders {
		out = append(out, NewOrderResponse(o))
	}
	return out
}

// EventBuyerResponse is a purchaser row for the organizer's ticket-buyers view.
type EventBuyerResponse struct {
	OrderID    string  `json:"order_id"`
	BuyerName  string  `json:"buyer_name"`
	BuyerEmail string  `json:"buyer_email"`
	Quantity   int     `json:"quantity"`
	TotalPrice float64 `json:"total_price"`
	Status     string  `json:"status"`
	ScannedAt  *string `json:"scanned_at"`
	CreatedAt  string  `json:"created_at"`
}

// NewEventBuyerList maps domain buyers to response DTOs.
func NewEventBuyerList(buyers []domain.EventBuyer) []EventBuyerResponse {
	out := make([]EventBuyerResponse, 0, len(buyers))
	for _, b := range buyers {
		row := EventBuyerResponse{
			OrderID: b.OrderID, BuyerName: b.BuyerName, BuyerEmail: b.BuyerEmail,
			Quantity: b.Quantity, TotalPrice: b.TotalPrice, Status: b.Status,
			CreatedAt: b.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		if b.ScannedAt != nil {
			s := b.ScannedAt.Format("2006-01-02T15:04:05Z07:00")
			row.ScannedAt = &s
		}
		out = append(out, row)
	}
	return out
}

// UploadedFileResponse is a single stored image.
type UploadedFileResponse struct {
	URL      string `json:"url"`
	PublicID string `json:"public_id"`
}

// UploadResponse is the result of an image upload.
type UploadResponse struct {
	Files []UploadedFileResponse `json:"files"`
}

// NewUploadResponse maps domain uploaded files to a response DTO.
func NewUploadResponse(files []domain.UploadedFile) UploadResponse {
	resp := UploadResponse{Files: make([]UploadedFileResponse, 0, len(files))}
	for _, f := range files {
		resp.Files = append(resp.Files, UploadedFileResponse{URL: f.URL, PublicID: f.PublicID})
	}
	return resp
}

// DeleteFilesRequest is the body for DELETE /api/upload.
type DeleteFilesRequest struct {
	PublicIDs []string `json:"public_ids"`
}

// InteractionStatusResponse reports a user's bookmark/follow state for an event.
type InteractionStatusResponse struct {
	Bookmarked bool `json:"bookmarked"`
	Following  bool `json:"following"`
}

// CategorySalesResponse is per-category ticket sales.
type CategorySalesResponse struct {
	CategoryID   string `json:"category_id"`
	CategoryName string `json:"category_name"`
	TicketsSold  int    `json:"tickets_sold"`
}

// AnalyticsResponse is the admin dashboard payload.
type AnalyticsResponse struct {
	TotalUsers       int                     `json:"total_users"`
	TotalTicketsSold int                     `json:"total_tickets_sold"`
	SalesByCategory  []CategorySalesResponse `json:"sales_by_category"`
	TopCategory      *CategorySalesResponse  `json:"top_category"`
}

// NewAnalyticsResponse maps domain analytics to its response DTO.
func NewAnalyticsResponse(a *domain.Analytics) AnalyticsResponse {
	resp := AnalyticsResponse{
		TotalUsers: a.TotalUsers, TotalTicketsSold: a.TotalTicketsSold,
		SalesByCategory: make([]CategorySalesResponse, 0, len(a.SalesByCategory)),
	}
	for _, s := range a.SalesByCategory {
		resp.SalesByCategory = append(resp.SalesByCategory, CategorySalesResponse{
			CategoryID: s.CategoryID, CategoryName: s.CategoryName, TicketsSold: s.TicketsSold,
		})
	}
	if a.TopCategory != nil {
		resp.TopCategory = &CategorySalesResponse{
			CategoryID: a.TopCategory.CategoryID, CategoryName: a.TopCategory.CategoryName, TicketsSold: a.TopCategory.TicketsSold,
		}
	}
	return resp
}
