// Package mailer provides email delivery. The default implementation renders
// templates from the templates/ directory and logs them, which is sufficient
// for development; swap in an SMTP sender for production.
package mailer

import (
	"bytes"
	"html/template"
	"log"
	"path/filepath"
)

// LogMailer renders email templates and writes them to the application log.
type LogMailer struct {
	templateDir string
}

// NewLogMailer builds a LogMailer that reads templates from templateDir.
func NewLogMailer(templateDir string) *LogMailer {
	return &LogMailer{templateDir: templateDir}
}

// SendPasswordReset renders the HTML reset email and logs it (dev delivery).
func (m *LogMailer) SendPasswordReset(to, resetLink string) error {
	body, err := m.render("password_reset.html", map[string]string{"Link": resetLink})
	if err != nil {
		return err
	}
	log.Printf("[mailer] password reset email to %s:\n%s", to, body)
	return nil
}

// Send logs an email to the given recipients (dev delivery).
func (m *LogMailer) Send(to []string, subject, htmlBody string) error {
	log.Printf("[mailer] email to %v\nsubject: %s\n%s", to, subject, htmlBody)
	return nil
}

func (m *LogMailer) render(name string, data any) (string, error) {
	tmpl, err := template.ParseFiles(filepath.Join(m.templateDir, name))
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
