package main

import (
	"fmt"
	"log"

	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := config.ConnectDB(config.Env.DBDSN); err != nil {
		log.Fatalf("Failed to connect DB: %v", err)
	}

	keptEmails := []string{"dohuubinh@gmail.com", "thaybinh1999@gmail.com"}

	var targetUsers []models.User
	if err := config.DB.Unscoped().Where("email NOT IN ?", keptEmails).Find(&targetUsers).Error; err != nil {
		log.Fatalf("Failed to query target users: %v", err)
	}

	fmt.Printf("Tìm thấy %d tài khoản cần xóa (giữ lại: %v)\n", len(targetUsers), keptEmails)
	for _, u := range targetUsers {
		fmt.Printf("- %s (%s, role: %s, ID: %s)\n", u.Email, u.FullName, u.Role, u.ID)
	}

	if len(targetUsers) == 0 {
		fmt.Println("Không có tài khoản nào cần xóa.")
		var allUsers []models.User
		config.DB.Unscoped().Find(&allUsers)
		fmt.Printf("Danh sách %d tài khoản hiện có trong database:\n", len(allUsers))
		for _, u := range allUsers {
			fmt.Printf("- Email: %s | Tên: %s | Role: %s | ID: %s\n", u.Email, u.FullName, u.Role, u.ID)
		}
		return
	}

	var targetIDs []string
	for _, u := range targetUsers {
		targetIDs = append(targetIDs, u.ID.String())
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Gỡ liên kết giới thiệu (referrer_id) trỏ tới các user bị xóa
	if err := tx.Model(&models.User{}).Where("referrer_id IN ?", targetIDs).Update("referrer_id", nil).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Lỗi gỡ referrer_id: %v", err)
	}

	// 2. Xóa lịch sử giao dịch liên quan
	if err := tx.Unscoped().Where("user_id IN ?", targetIDs).Delete(&models.Transaction{}).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Lỗi xóa transactions: %v", err)
	}

	// 3. Xóa các voucher tiếp thị thuộc về các user bị xóa
	if err := tx.Unscoped().Where("affiliate_id IN ?", targetIDs).Delete(&models.Voucher{}).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Lỗi xóa vouchers: %v", err)
	}

	// 4. Xóa vĩnh viễn (Hard delete) các user mục tiêu khỏi bảng users
	if err := tx.Unscoped().Where("id IN ?", targetIDs).Delete(&models.User{}).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Lỗi xóa users: %v", err)
	}

	if err := tx.Commit().Error; err != nil {
		log.Fatalf("Lỗi commit transaction: %v", err)
	}

	fmt.Printf("Đã xóa thành công vĩnh viễn %d tài khoản khỏi database.\n", len(targetUsers))
}
