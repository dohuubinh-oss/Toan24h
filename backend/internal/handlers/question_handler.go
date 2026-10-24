package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
	"github.com/modeptrai/exam-model-backend/internal/models"
	"github.com/modeptrai/exam-model-backend/internal/services"
	"github.com/modeptrai/exam-model-backend/internal/utils"
	"gorm.io/gorm"
)

var tempImgRegex = regexp.MustCompile(`src=["'](/uploads/temp/[^"']+)["']`)

func isStaffRequester(c *gin.Context) bool {
	tokenString := ""
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}
	if tokenString == "" {
		cookieToken, _ := c.Cookie("accessToken")
		tokenString = cookieToken
	}
	if tokenString != "" {
		claims, err := utils.ValidateToken(tokenString)
		if err == nil && (claims.Role == "admin" || claims.Role == "teacher") {
			return true
		}
	}
	return false
}

func sanitizeQuestionForPublic(q *models.Question) {
	q.CorrectAnswer = ""
	q.SolutionGuide = ""
	q.ShortAnswer = ""
	q.QuickSolveTips = ""
	for i := range q.SubQuestions {
		q.SubQuestions[i].CorrectAnswer = ""
		q.SubQuestions[i].SolutionGuide = ""
		q.SubQuestions[i].ShortAnswer = ""
		q.SubQuestions[i].QuickSolveTips = ""
	}
}

// APIResponse là định dạng gói tin trả về chuẩn
type APIResponse struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  string      `json:"error,omitempty"`
}

// QuestionDetail DTO cho từng câu hỏi con
type QuestionDetail struct {
	GgDrive         string   `json:"gg_drive"`
	BookName        string   `json:"book_name"`
	Cate            string   `json:"cate"`
	TypeQuestion    string   `json:"type_question"`
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Grade           int      `json:"grade"`
	Topic           string   `json:"topic"`
	DifficultyLevel string   `json:"difficulty_level"`
	DifficultyPoint float32  `json:"difficulty_point"`
	Point           float32  `json:"point"`
	Tags            []string `json:"tags"`
	Options         []string `json:"options"`
	CorrectAnswer   string   `json:"correct_answer"`
	SolutionGuide   any      `json:"solution_guide"`
	Hint            string   `json:"hint"`
	ShortAnswer     string   `json:"short_answer"`
	QuickSolveTips  string   `json:"quick_solve_tips"`
	GeneralMethod   string   `json:"general_method"`
	Mistakes        string   `json:"mistakes"`
}

// QuestionGroup DTO cho nhóm câu hỏi
type QuestionGroup struct {
	SharedContent *string          `json:"shared_content"`
	TypeQuestion  string           `json:"type_question"`
	IsGroup       bool             `json:"is_group"`
	Point         float32          `json:"point"`
	Questions     []QuestionDetail `json:"questions"`
}

// processImageUrl checks if an image is in the temp folder, moves it to the final folder, and returns the new URL
func processImageUrl(originalUrl string, grade int) string {
	if !strings.HasPrefix(originalUrl, "/uploads/temp/") {
		return originalUrl
	}

	rawFileName := strings.TrimPrefix(originalUrl, "/uploads/temp/")
	// Sanitize fileName using filepath.Base to prevent path traversal (e.g., ../)
	fileName := filepath.Base(rawFileName)
	if fileName == "." || fileName == "/" || fileName == ".." {
		return originalUrl
	}

	sourcePath := filepath.Join(".", "uploads", "temp", fileName)

	// Thư mục đích: uploads/questions/{grade}
	folderName := fmt.Sprintf("%d", grade)
	finalDir := filepath.Join(".", "uploads", "questions", folderName)

	if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
		return originalUrl
	}

	finalPath := filepath.Join(finalDir, fileName)

	// Move file
	if err := os.Rename(sourcePath, finalPath); err != nil {
		return originalUrl
	}

	return fmt.Sprintf("/uploads/questions/%s/%s", folderName, fileName)
}

// processHtmlImages quét và chuyển tất cả ảnh trong mã HTML
func processHtmlImages(htmlContent string, grade int) string {
	if htmlContent == "" {
		return htmlContent
	}
	updatedContent := tempImgRegex.ReplaceAllStringFunc(htmlContent, func(match string) string {
		parts := tempImgRegex.FindStringSubmatch(match)
		if len(parts) > 1 {
			originalUrl := parts[1]
			newUrl := processImageUrl(originalUrl, grade)
			return fmt.Sprintf(`src="%s"`, newUrl)
		}
		return match
	})
	return updatedContent
}

func stringifySolutionGuide(sg any) string {
	if sg == nil {
		return ""
	}
	switch v := sg.(type) {
	case string:
		return v
	case []byte:
		return string(v)
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return fmt.Sprintf("%v", v)
		}
		return string(b)
	}
}

// BulkCreateQuestions xử lý tạo hàng loạt câu hỏi (bao gồm câu đơn và câu chùm)
func BulkCreateQuestions(c *gin.Context) {
	var payload []QuestionGroup
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if len(payload) == 0 {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: "Danh sách câu hỏi không được để trống"})
		return
	}

	if len(payload) > 100 {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: "Chỉ được tạo tối đa 100 nhóm câu hỏi mỗi lần"})
		return
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Could not start transaction"})
		return
	}

	var createdCount int

	for _, group := range payload {
		var parentID *uuid.UUID

		sharedText := ""
		if group.SharedContent != nil {
			sharedText = *group.SharedContent
		}

		isGroup := (group.IsGroup || strings.EqualFold(group.TypeQuestion, "group")) && len(group.Questions) > 1
		if isGroup {
			groupPoint := float32(len(group.Questions))
			if group.Point > 0 {
				groupPoint = group.Point
			}
			parentQ := models.Question{
				TypeQuestion: "group",
				Content:      processHtmlImages(sharedText, group.Questions[0].Grade), // Dùng grade của câu hỏi đầu tiên
				Point:        groupPoint,
				Tags:         "[]",
				Options:      "[]",
			}

			if err := tx.Create(&parentQ).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to create group parent: " + err.Error()})
				return
			}
			parentID = &parentQ.ID
			createdCount++
		} else if len(group.Questions) == 1 && sharedText != "" {
			// Nếu chỉ có 1 câu hỏi con nhưng có sharedText dẫn dắt, tự động gộp vào nội dung câu hỏi
			st := strings.TrimSpace(sharedText)
			qc := strings.TrimSpace(group.Questions[0].Content)
			if qc == "" {
				group.Questions[0].Content = st
			} else if !strings.Contains(qc, st) {
				group.Questions[0].Content = st + "\n" + qc
			}
		}

		for _, detail := range group.Questions {
			tagsBytes, _ := json.Marshal(detail.Tags)
			optionsBytes, _ := json.Marshal(detail.Options)

			cate := detail.Cate
			if cate == "" {
				cate = "exam"
			}

			driveVal := detail.GgDrive
			if driveVal == "" {
				driveVal = detail.BookName
			}

			resolvedShortAnswer := detail.ShortAnswer
			if resolvedShortAnswer == "" {
				resolvedShortAnswer = detail.QuickSolveTips
			}
			processedShortAnswer := processHtmlImages(resolvedShortAnswer, detail.Grade)

			childQ := models.Question{
				ParentID:        parentID,
				GgDrive:         driveVal,
				BookName:        driveVal,
				Cate:            cate,
				TypeQuestion:    "single",
				Content:         processHtmlImages(detail.Content, detail.Grade),
				Type:            detail.Type,
				Grade:           detail.Grade,
				Topic:           detail.Topic,
				DifficultyLevel: detail.DifficultyLevel,
				DifficultyPoint: detail.DifficultyPoint,
				Point:           detail.Point,
				Tags:            string(tagsBytes),
				Options:         string(optionsBytes),
				CorrectAnswer:   processHtmlImages(detail.CorrectAnswer, detail.Grade),
				SolutionGuide:   processHtmlImages(stringifySolutionGuide(detail.SolutionGuide), detail.Grade),
				Hint:            processHtmlImages(detail.Hint, detail.Grade),
				ShortAnswer:     processedShortAnswer,
				QuickSolveTips:  processedShortAnswer,
				GeneralMethod:   processHtmlImages(detail.GeneralMethod, detail.Grade),
				Mistakes:        processHtmlImages(detail.Mistakes, detail.Grade),
			}

			if err := tx.Create(&childQ).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to create question: " + err.Error()})
				return
			}
			createdCount++
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Status: "success", 
		Data: map[string]interface{}{
			"message": "Bulk creation successful",
			"count":   createdCount,
		},
	})
}

// GetQuestions xử lý lấy danh sách câu hỏi có phân trang
func GetQuestions(c *gin.Context) {
	var questions []models.Question
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 {
		limit = 10
	} else if limit > 100 {
		limit = 100
	}
	
	idsParam := c.Query("ids")
	var ids []string
	if idsParam != "" {
		ids = strings.Split(idsParam, ",")
	}

	var query *gorm.DB
	if len(ids) > 0 {
		query = config.DB.Model(&models.Question{}).Where("id IN ?", ids)
		limit = 1000 // If specific IDs are requested, override limit to fetch them all
	} else {
		query = config.DB.Model(&models.Question{}).Where("parent_id IS NULL")

		type filter struct {
			Query string
			Args  []interface{}
		}
		var filters []filter

		cateParam := c.Query("cate")
		if cateParam != "" {
			filters = append(filters, filter{"cate = ?", []interface{}{cateParam}})
		}

		gradeParam := c.Query("grade")
		if gradeParam != "" {
			if grade, err := strconv.Atoi(gradeParam); err == nil {
				filters = append(filters, filter{"grade = ?", []interface{}{grade}})
			}
		}

		topicParam := c.Query("topic")
		if topicParam != "" {
			filters = append(filters, filter{"topic = ?", []interface{}{topicParam}})
		}

		typeParam := c.Query("type")
		if typeParam != "" {
			switch typeParam {
			case "Câu hỏi chùm":
				query = query.Where("type_question = ?", "group")
			case "Trắc nghiệm", "Tự luận":
				query = query.Where("type_question = ?", "single").Where("type = ?", typeParam)
			}
		}

		diffParam := c.Query("difficulty")
		if diffParam != "" {
			filters = append(filters, filter{"difficulty_level = ?", []interface{}{diffParam}})
		}

		qParam := c.Query("q")
		if qParam != "" {
			searchStr := "%" + qParam + "%"
			filters = append(filters, filter{"lower(content) LIKE lower(?)", []interface{}{searchStr}})
		}

		if len(filters) > 0 {
			var parentConds []string
			var childConds []string
			var parentArgs []interface{}
			var childArgs []interface{}

			for _, f := range filters {
				parentConds = append(parentConds, f.Query)
				parentArgs = append(parentArgs, f.Args...)

				childConds = append(childConds, f.Query)
				childArgs = append(childArgs, f.Args...)
			}

			parentWhere := strings.Join(parentConds, " AND ")
			childWhere := strings.Join(childConds, " AND ")

			combinedQuery := fmt.Sprintf("(%s) OR id IN (SELECT parent_id FROM questions WHERE parent_id IS NOT NULL AND (%s))", parentWhere, childWhere)
			combinedArgs := append(parentArgs, childArgs...)
			query = query.Where(combinedQuery, combinedArgs...)
		}
	}
	
	offset := (page - 1) * limit

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if err := query.Preload("SubQuestions").Order("created_at desc, id desc").Limit(limit).Offset(offset).Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if !isStaffRequester(c) {
		for i := range questions {
			sanitizeQuestionForPublic(&questions[i])
		}
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success", 
		Data: map[string]interface{}{
			"items": questions,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// GetQuestionByID xử lý lấy chi tiết 1 câu hỏi
func GetQuestionByID(c *gin.Context) {
	id := c.Param("id")
	var q models.Question

	if err := config.DB.Preload("SubQuestions", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at ASC")
	}).First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	if !isStaffRequester(c) {
		sanitizeQuestionForPublic(&q)
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: q})
}

// UpdateQuestion xử lý cập nhật câu hỏi
func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")
	var q models.Question

	if err := config.DB.Preload("SubQuestions").First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	var updateData models.Question
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	// Update SubQuestions if it's a group question
	if updateData.TypeQuestion == "group" {
		// Ensure all subquestions have the ParentID set correctly
		for i := range updateData.SubQuestions {
			updateData.SubQuestions[i].ParentID = &q.ID
		}
		if err := config.DB.Model(&q).Association("SubQuestions").Replace(updateData.SubQuestions); err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to sync subquestions"})
			return
		}
	} else if q.TypeQuestion == "group" && updateData.TypeQuestion != "group" {
		// If changed from group to single, clear subquestions
		config.DB.Model(&q).Association("SubQuestions").Clear()
	}

	// Preserve crucial fields
	updateData.ID = q.ID
	updateData.CreatedAt = q.CreatedAt
	updateData.DeletedAt = q.DeletedAt
	updateData.ParentID = q.ParentID

	// Ensure JSONB fields are valid JSON strings
	if updateData.Tags == "" {
		if q.Tags != "" {
			updateData.Tags = q.Tags
		} else {
			updateData.Tags = "[]"
		}
	}
	if updateData.Options == "" {
		if q.Options != "" {
			updateData.Options = q.Options
		} else {
			updateData.Options = "[]"
		}
	}

	// Save all fields except associations
	if err := config.DB.Omit("SubQuestions").Save(&updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: updateData})
}

// DeleteQuestion xử lý xoá câu hỏi (xoá mềm câu hỏi và câu con, đồng thời dọn ảnh đĩa nếu không còn tham chiếu)
func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")

	var targetQuestions []models.Question
	if err := config.DB.Where("id = ? OR parent_id = ?", id, id).Find(&targetQuestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	if len(targetQuestions) == 0 {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	var deletingIDs []string
	var candidateImages []string
	for _, q := range targetQuestions {
		deletingIDs = append(deletingIDs, q.ID.String())
		imgs := services.ExtractQuestionImageURLs(
			q.Content, q.Options, q.SolutionGuide, q.Hint,
			q.ShortAnswer, q.QuickSolveTips, q.GeneralMethod, q.Mistakes,
		)
		candidateImages = append(candidateImages, imgs...)
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		return tx.Where("id IN (?)", deletingIDs).Delete(&models.Question{}).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	// Dọn ảnh vật lý nếu không còn câu hỏi nào khác tham chiếu
	if len(candidateImages) > 0 {
		unused := services.FilterUnusedQuestionImages(config.DB, candidateImages, deletingIDs)
		services.DeletePhysicalImages(unused)
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success",
		Data: map[string]interface{}{
			"deletedCount": len(deletingIDs),
		},
	})
}

// ReportQuestion xử lý khi học sinh báo cáo lỗi đề thi
func ReportQuestion(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	var q models.Question
	if err := config.DB.First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	uid, _ := utils.GetUserIDString(c)
	formattedMessage := fmt.Sprintf("[%s] %s", uid, req.Message)

	// Update flags
	q.IsReported = true
	// Nối thêm tin nhắn nếu đã có người report trước đó (hoặc thay thế)
	if q.ReportMessage != "" {
		q.ReportMessage = q.ReportMessage + " || " + formattedMessage
	} else {
		q.ReportMessage = formattedMessage
	}

	if err := config.DB.Save(&q).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to save report"})
		return
	}

	if !isStaffRequester(c) {
		sanitizeQuestionForPublic(&q)
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: q})
}

// ResolveReportQuestion xử lý đánh dấu đã giải quyết báo cáo lỗi
func ResolveReportQuestion(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		TeacherFeedback string `json:"teacherFeedback"`
	}
	// Parse optional feedback, ignore error if empty
	c.ShouldBindJSON(&req)

	var q models.Question
	if err := config.DB.First(&q, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, APIResponse{Status: "error", Error: "Question not found"})
		return
	}

	messages := strings.Split(q.ReportMessage, " || ")
	notifiedUsers := make(map[string]bool)
	for _, msg := range messages {
		if strings.HasPrefix(msg, "[") {
			endIdx := strings.Index(msg, "]")
			if endIdx > 1 {
				uidStr := msg[1:endIdx]
				if uidStr != "" && !notifiedUsers[uidStr] {
					notifiedUsers[uidStr] = true
					uid, err := uuid.Parse(uidStr)
					if err == nil {
						config.DB.Create(&models.Notification{
							UserID:  uid,
							Title:   "Kết quả báo lỗi",
							Message: fmt.Sprintf("Báo lỗi của bạn cho câu hỏi đã được giáo viên phản hồi: %s", req.TeacherFeedback),
							Link:    "/dashboard", 
						})
						var u models.User
						if err := config.DB.First(&u, "id = ?", uid).Error; err == nil {
							notifier := services.NewTelegramNotifier()
							tgMsg := fmt.Sprintf("🔔 <b>Kết quả báo lỗi câu hỏi</b>\nBáo lỗi của bạn đã được giáo viên phản hồi: %s\n\n🔗 Xem chi tiết: %s/dashboard", req.TeacherFeedback, config.Env.FrontendURL)
							go notifier.SendToUser(&u, tgMsg)
						}
					}
				}
			}
		}
	}

	if err := config.DB.Model(&q).Updates(map[string]interface{}{
		"is_reported": false,
		"report_message": "",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: "Failed to resolve report"})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success"})
}

// GetReportedQuestions lấy danh sách câu hỏi bị báo cáo lỗi (dành cho Admin)
func GetReportedQuestions(c *gin.Context) {
	var questions []models.Question
	
	// Only fetch questions that are reported
	if err := config.DB.Where("is_reported = ?", true).Order("updated_at desc").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{Status: "error", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Status: "success", Data: questions})
}
