package mailer

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"path/filepath"
)

// SMTPConfig holds the SMTP server credentials.
type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

// Configured reports whether the minimum SMTP settings are present.
func (c SMTPConfig) Configured() bool {
	return c.Host != "" && c.Port != "" && c.From != ""
}

// SMTPMailer delivers email through an SMTP server.
type SMTPMailer struct {
	cfg         SMTPConfig
	templateDir string
}

// NewSMTPMailer builds an SMTP-backed mailer.
func NewSMTPMailer(cfg SMTPConfig, templateDir string) *SMTPMailer {
	return &SMTPMailer{cfg: cfg, templateDir: templateDir}
}

// SendPasswordReset renders and sends the reset email.
func (m *SMTPMailer) SendPasswordReset(to, resetLink string) error {
	body, err := renderTemplate(m.templateDir, "password_reset.html", map[string]string{"Link": resetLink})
	if err != nil {
		return err
	}
	return m.Send([]string{to}, "Reset your LocalEvent password", body)
}

// Send delivers an HTML email; multiple recipients are hidden from each other.
func (m *SMTPMailer) Send(to []string, subject, htmlBody string) error {
	if len(to) == 0 {
		return nil
	}
	addr := m.cfg.Host + ":" + m.cfg.Port
	auth := smtp.PlainAuth("", m.cfg.Username, m.cfg.Password, m.cfg.Host)

	var msg bytes.Buffer
	fmt.Fprintf(&msg, "From: %s\r\n", m.cfg.From)
	fmt.Fprintf(&msg, "To: %s\r\n", m.cfg.From) // recipients go via RCPT (BCC)
	fmt.Fprintf(&msg, "Subject: %s\r\n", subject)
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n")
	msg.WriteString(htmlBody)

	return smtp.SendMail(addr, auth, m.cfg.From, to, msg.Bytes())
}

func renderTemplate(dir, name string, data any) (string, error) {
	tmpl, err := template.ParseFiles(filepath.Join(dir, name))
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
