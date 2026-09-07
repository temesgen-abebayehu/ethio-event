package route

import (
	"net/http"

	"local-event-backend/delivery/controller"
	"local-event-backend/infrastructure/middleware"

	"github.com/gorilla/mux"
)

// Controllers bundles every controller for route registration.
type Controllers struct {
	Auth        *controller.AuthController
	Event       *controller.EventController
	Category    *controller.CategoryController
	Tag         *controller.TagController
	Interaction *controller.InteractionController
	Upload      *controller.UploadController
	Payment     *controller.PaymentController
	Analytics   *controller.AnalyticsController
}

// New builds the application router with all routes and middleware.
func New(c Controllers, mw *middleware.Middleware) http.Handler {
	r := mux.NewRouter()

	r.HandleFunc("/health", controller.Health).Methods("GET")
	r.HandleFunc("/webhook/chapa", c.Payment.Callback).Methods("POST")

	api := r.PathPrefix("/api").Subrouter()

	// Auth
	api.HandleFunc("/auth/signup", c.Auth.Signup).Methods("POST")
	api.HandleFunc("/auth/login", c.Auth.Login).Methods("POST")
	api.HandleFunc("/auth/forgot-password", c.Auth.ForgotPassword).Methods("POST")
	api.HandleFunc("/auth/reset-password", c.Auth.ResetPassword).Methods("POST")
	api.HandleFunc("/auth/me", mw.RequireAuth(c.Auth.Me)).Methods("GET")
	api.HandleFunc("/auth/me", mw.RequireAuth(c.Auth.UpdateProfile)).Methods("PUT")
	api.HandleFunc("/auth/change-password", mw.RequireAuth(c.Auth.ChangePassword)).Methods("POST")

	// Events — specific paths must precede the {idOrSlug} catch-all.
	api.HandleFunc("/events", c.Event.List).Methods("GET")
	api.HandleFunc("/events", mw.RequireOrganizer(c.Event.Create)).Methods("POST")
	api.HandleFunc("/events/nearby", c.Event.Nearby).Methods("GET")
	api.HandleFunc("/events/mine", mw.RequireOrganizer(c.Event.Mine)).Methods("GET")
	api.HandleFunc("/events/{idOrSlug}", mw.OptionalAuth(c.Event.Get)).Methods("GET")
	api.HandleFunc("/events/{id}", mw.RequireOrganizer(c.Event.Update)).Methods("PUT")
	api.HandleFunc("/events/{id}", mw.RequireOrganizer(c.Event.Delete)).Methods("DELETE")

	// Interactions
	api.HandleFunc("/events/{id}/bookmark", mw.RequireAuth(c.Interaction.Bookmark)).Methods("POST")
	api.HandleFunc("/events/{id}/bookmark", mw.RequireAuth(c.Interaction.RemoveBookmark)).Methods("DELETE")
	api.HandleFunc("/events/{id}/follow", mw.RequireAuth(c.Interaction.Follow)).Methods("POST")
	api.HandleFunc("/events/{id}/follow", mw.RequireAuth(c.Interaction.Unfollow)).Methods("DELETE")
	api.HandleFunc("/events/{id}/interactions", mw.RequireAuth(c.Interaction.Status)).Methods("GET")
	api.HandleFunc("/events/{id}/buyers", mw.RequireOrganizer(c.Payment.EventBuyers)).Methods("GET")
	api.HandleFunc("/events/{id}/notify", mw.RequireOrganizer(c.Payment.NotifyBuyers)).Methods("POST")

	// Categories & tags
	api.HandleFunc("/categories", c.Category.List).Methods("GET")
	api.HandleFunc("/tags", c.Tag.List).Methods("GET")

	// Uploads
	api.HandleFunc("/upload", mw.RequireAuth(c.Upload.Upload)).Methods("POST")
	api.HandleFunc("/upload", mw.RequireAuth(c.Upload.Delete)).Methods("DELETE")

	// Payments
	api.HandleFunc("/payments/initiate", mw.RequireAuth(c.Payment.Initiate)).Methods("POST")
	api.HandleFunc("/payments/verify", mw.RequireAuth(c.Payment.Verify)).Methods("POST")
	api.HandleFunc("/tickets/scan", mw.RequireOrganizer(c.Payment.ScanTicket)).Methods("POST")

	// Current-user collections
	api.HandleFunc("/me/bookmarks", mw.RequireAuth(c.Interaction.Bookmarks)).Methods("GET")
	api.HandleFunc("/me/follows", mw.RequireAuth(c.Interaction.Follows)).Methods("GET")
	api.HandleFunc("/me/tickets", mw.RequireAuth(c.Payment.MyTickets)).Methods("GET")

	// Admin
	api.HandleFunc("/admin/categories", mw.RequireAdmin(c.Category.ListAll)).Methods("GET")
	api.HandleFunc("/admin/categories", mw.RequireAdmin(c.Category.Create)).Methods("POST")
	api.HandleFunc("/admin/categories/{id}", mw.RequireAdmin(c.Category.Update)).Methods("PUT")
	api.HandleFunc("/admin/categories/{id}", mw.RequireAdmin(c.Category.Delete)).Methods("DELETE")
	api.HandleFunc("/admin/categories/{id}/active", mw.RequireAdmin(c.Category.SetActive)).Methods("PATCH")
	api.HandleFunc("/admin/analytics", mw.RequireAdmin(c.Analytics.Get)).Methods("GET")

	// CORS wraps the whole router so preflight OPTIONS is handled before routing.
	return mw.CORS(r)
}
