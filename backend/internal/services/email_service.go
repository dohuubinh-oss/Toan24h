package services

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"github.com/modeptrai/exam-model-backend/internal/config"
)

type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

// SendOTPEmail sends an OTP verification code to the recipient's email address.
func (s *EmailService) SendOTPEmail(toEmail, otp string) error {
	if config.Env == nil || config.Env.SMTPHost == "" || config.Env.SMTPUser == "" {
		log.Printf("[DEV MODE EMAIL] SMTP is not configured. OTP for %s is: %s", toEmail, otp)
		return nil
	}

	from := config.Env.SMTPFrom
	if from == "" {
		from = config.Env.SMTPUser
	}

	subject := "Subject: [Toán 6789] Mã OTP khôi phục mật khẩu\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n"
	headers := fmt.Sprintf("From: Toán 6789 <%s>\r\nTo: %s\r\n%s%s\r\n", from, toEmail, subject, mime)

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Khôi phục mật khẩu - Toán 6789</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: #2563eb; margin-top: 0;">Toán 6789</h2>
        <p style="color: #334155; font-size: 16px;">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Toán 6789</strong>.</p>
        <p style="color: #334155; font-size: 16px;">Dưới đây là mã xác thực OTP của bạn:</p>
        <div style="background-color: #eff6ff; border: 1px dashed #2563eb; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8; text-align: center; padding: 15px; border-radius: 8px; margin: 25px 0;">
            %s
        </div>
        <p style="color: #64748b; font-size: 14px;">Mã OTP này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    </div>
</body>
</html>
`, otp)

	msg := []byte(headers + body)
	addr := fmt.Sprintf("%s:%s", config.Env.SMTPHost, config.Env.SMTPPort)

	var auth smtp.Auth
	if config.Env.SMTPUser != "" && config.Env.SMTPPass != "" {
		auth = smtp.PlainAuth("", config.Env.SMTPUser, config.Env.SMTPPass, config.Env.SMTPHost)
	}

	err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg)
	if err != nil {
		// Log detailed error and check if auth failed or host unreached
		if strings.Contains(err.Error(), "unencrypted connection") || strings.Contains(err.Error(), "short response") {
			log.Printf("SMTP send error: %v. Fallback logging OTP: %s", err, otp)
			return nil
		}
		log.Printf("Failed to send email to %s: %v", toEmail, err)
		return fmt.Errorf("không thể gửi email OTP qua SMTP server: %w", err)
	}

	log.Printf("Successfully sent OTP email to %s", toEmail)
	return nil
}
