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

	subject := "Subject: [Toán 6789] Mã OTP xác thực khôi phục mật khẩu\r\n"
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
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 22px;">Toán 6789</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Chào bạn, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Toán 6789</strong>.</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dưới đây là mã xác thực OTP của bạn:</p>
        <div style="background-color: #eff6ff; border: 1px dashed #2563eb; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8; text-align: center; padding: 15px; border-radius: 10px; margin: 24px 0;">
            %s
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>. Để bảo vệ tài khoản, bạn tuyệt đối không chia sẻ mã này cho bất kỳ ai nhé.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Nếu bạn không yêu cầu mã này, bạn chỉ cần an tâm bỏ qua email này nhé.</p>
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

// SendVerificationEmail gửi liên kết kích hoạt tài khoản tới email người dùng
func (s *EmailService) SendVerificationEmail(toEmail, fullName, verifyLink string) error {
	if config.Env == nil || config.Env.SMTPHost == "" || config.Env.SMTPUser == "" {
		log.Printf("[DEV MODE EMAIL] SMTP is not configured. Verification link for %s (%s) is: %s", fullName, toEmail, verifyLink)
		return nil
	}

	from := config.Env.SMTPFrom
	if from == "" {
		from = config.Env.SMTPUser
	}

	subject := "Subject: [Toán 6789] Kích hoạt tài khoản học tập của bạn\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n"
	headers := fmt.Sprintf("From: Toán 6789 <%s>\r\nTo: %s\r\n%s%s\r\n", from, toEmail, subject, mime)

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kích hoạt tài khoản - Toán 6789</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2563eb; font-size: 26px; margin: 0; font-weight: bold;">Toán 6789</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Cùng bạn làm chủ môn Toán mỗi ngày</p>
        </div>
        <p style="color: #0f172a; font-size: 16px; line-height: 1.5;">Xin chào <strong>%s</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Chào mừng bạn đến với <strong>Toán 6789</strong>! Chỉ còn một bước nhỏ nữa thôi, bạn hãy nhấn nút dưới đây để kích hoạt tài khoản và bắt đầu hành trình học tập nhé:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="%s" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                Kích hoạt tài khoản ngay
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Nếu nút bấm trên không mở được, bạn có thể sao chép liên kết sau và dán vào trình duyệt web:<br/>
            <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            * Liên kết kích hoạt này có hiệu lực trong vòng <strong>24 giờ</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Nếu bạn không tạo tài khoản này, bạn chỉ cần an tâm bỏ qua email này nhé.
        </p>
    </div>
</body>
</html>
`, fullName, verifyLink, verifyLink, verifyLink)

	msg := []byte(headers + body)
	addr := fmt.Sprintf("%s:%s", config.Env.SMTPHost, config.Env.SMTPPort)

	var auth smtp.Auth
	if config.Env.SMTPUser != "" && config.Env.SMTPPass != "" {
		auth = smtp.PlainAuth("", config.Env.SMTPUser, config.Env.SMTPPass, config.Env.SMTPHost)
	}

	err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg)
	if err != nil {
		if strings.Contains(err.Error(), "unencrypted connection") || strings.Contains(err.Error(), "short response") {
			log.Printf("SMTP send error: %v. Fallback verification link: %s", err, verifyLink)
			return nil
		}
		log.Printf("Failed to send verification email to %s: %v", toEmail, err)
		return fmt.Errorf("không thể gửi email kích hoạt qua SMTP server: %w", err)
	}

	log.Printf("Successfully sent verification email to %s", toEmail)
	return nil
}
