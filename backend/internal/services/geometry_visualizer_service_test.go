package services

import (
	"os"
	"strings"
	"testing"
)

func TestExtractCleanSVG(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Pure SVG",
			input:    `<svg viewBox="0 0 500 400"><rect/></svg>`,
			expected: `<svg viewBox="0 0 500 400"><rect/></svg>`,
		},
		{
			name:     "Markdown wrapped XML block",
			input:    "```xml\n<svg viewBox=\"0 0 500 400\"><circle cx=\"10\" cy=\"10\" r=\"5\"/></svg>\n```",
			expected: `<svg viewBox="0 0 500 400"><circle cx="10" cy="10" r="5"/></svg>`,
		},
		{
			name:     "Markdown wrapped SVG block",
			input:    "```svg\n<svg viewBox=\"0 0 600 500\"><line x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"/></svg>\n```",
			expected: `<svg viewBox="0 0 600 500"><line x1="0" y1="0" x2="100" y2="100"/></svg>`,
		},
		{
			name:     "JSON string with diagram_svg field",
			input:    `{"diagram_svg": "<svg viewBox=\"0 0 600 500\"><polygon points=\"10,10 50,50 10,50\"/></svg>"}`,
			expected: `<svg viewBox="0 0 600 500"><polygon points="10,10 50,50 10,50"/></svg>`,
		},
		{
			name:     "Text with surrounding explanation",
			input:    "Dưới đây là hình vẽ:\n<svg viewBox=\"0 0 400 300\"><path d=\"M0 0\"/></svg>\nChúc bạn làm tốt!",
			expected: `<svg viewBox="0 0 400 300"><path d="M0 0"/></svg>`,
		},
		{
			name:     "Invalid without svg tag",
			input:    `Không có hình vẽ nào`,
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractCleanSVG(tt.input)
			if got != tt.expected {
				t.Errorf("ExtractCleanSVG() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestGenerateGeometrySVG_MissingAPIKey(t *testing.T) {
	orig := os.Getenv("GEMINI_API_KEY")
	os.Setenv("GEMINI_API_KEY", "")
	defer os.Setenv("GEMINI_API_KEY", orig)

	_, err := GenerateGeometrySVG(GeometryVisualizerRequest{
		Content:       "Cho tam giác ABC vuông tại A",
		SolutionGuide: "Kẻ đường cao AH",
	})
	if err == nil {
		t.Fatal("Expected error when GEMINI_API_KEY is not configured, got nil")
	}
	if !strings.Contains(err.Error(), "GEMINI_API_KEY is not configured") {
		t.Errorf("Unexpected error message: %v", err)
	}
}

func TestBuildGeometryContext_Priority(t *testing.T) {
	req := GeometryVisualizerRequest{
		Content:       "Cho tam giác ABC vuông tại A, đường cao AH.",
		SolutionGuide: "Kẻ AH vuông góc với BC.",
		CurrentSVG:    "<svg>old broken diagram</svg>",
		CustomPrompt:  "Hình vẽ sai rồi, tam giác ABC phải vuông tại A chứ không phải tại B!",
	}

	ctx := BuildGeometryContext(req)

	// 1. Verify highest priority header is at the very beginning
	if !strings.HasPrefix(ctx, "=================================================================\n🚨 MỆNH LỆNH & CHỈ DẪN BỔ SUNG CỦA GIÁO VIÊN (ƯU TIÊN TUYỆT ĐỐI CAO NHẤT):") {
		t.Errorf("Expected context to start with priority banner, got:\n%s", ctx)
	}

	// 2. Verify custom prompt content is prominently included
	if !strings.Contains(ctx, "Hình vẽ sai rồi, tam giác ABC phải vuông tại A chứ không phải tại B!") {
		t.Errorf("Expected custom prompt in context, not found in:\n%s", ctx)
	}

	// 3. Verify warning that old SVG must not be reused when custom prompt is present
	if !strings.Contains(ctx, "CHỈ ĐỂ THAM KHẢO LỖI SAI ĐÃ MẮC") {
		t.Errorf("Expected reference warning on current SVG when custom prompt is provided, not found in:\n%s", ctx)
	}

	// 4. Verify question and solution are present
	if !strings.Contains(ctx, "Cho tam giác ABC vuông tại A, đường cao AH.") {
		t.Errorf("Expected content in context, not found")
	}
	if !strings.Contains(ctx, "Kẻ AH vuông góc với BC.") {
		t.Errorf("Expected solution guide in context, not found")
	}
}
