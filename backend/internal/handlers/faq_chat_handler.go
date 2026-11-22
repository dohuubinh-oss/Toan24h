package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/modeptrai/exam-model-backend/internal/services"
)

type FAQChatHandler struct {
	service *services.FAQRagService
}

func NewFAQChatHandler(service *services.FAQRagService) *FAQChatHandler {
	return &FAQChatHandler{service: service}
}

type FAQChatRequest struct {
	Message string `json:"message" binding:"required"`
}

// HandleChatFAQ handles user questions and responds with RAG-grounded answers
func (h *FAQChatHandler) HandleChatFAQ(c *gin.Context) {
	var req FAQChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nội dung câu hỏi không được để trống",
		})
		return
	}

	cleanMessage := strings.TrimSpace(req.Message)
	if cleanMessage == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nội dung câu hỏi không được để trống",
		})
		return
	}

	if len([]rune(cleanMessage)) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Câu hỏi quá dài (tối đa 500 ký tự)",
		})
		return
	}

	resp, err := h.service.AskFAQ(c.Request.Context(), cleanMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Không thể xử lý câu hỏi lúc này. Vui lòng thử lại sau.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resp,
	})
}
