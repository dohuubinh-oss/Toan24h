package services

import (
	"image"
	"image/color"
	"os"
	"strings"
	"testing"
)

func TestParseAndProcessExtractedLecture(t *testing.T) {
	tempDir := "./test_uploads_temp_lecture"
	_ = os.MkdirAll(tempDir, os.ModePerm)
	defer os.RemoveAll(tempDir)

	mockImg := image.NewRGBA(image.Rect(0, 0, 200, 200))
	for y := 0; y < 200; y++ {
		for x := 0; x < 200; x++ {
			mockImg.Set(x, y, color.RGBA{R: 200, G: 100, B: 50, A: 255})
		}
	}

	rawJson := `[
		{
			"mathType": "Dạng 1: Rút gọn biểu thức",
			"methods": [
				{
					"methodName": "Phương pháp chung",
					"solution": "Áp dụng hằng đẳng thức [DIAGRAM_0_1]",
					"problems": [
						{
							"problem": "Ví dụ 1: Cho hình vẽ [DIAGRAM_0_1] và rút gọn.",
							"steps": [
								{ "step": 1, "title": "Bước 1", "content": "Khai triển", "formula": "A = x^2 - 1" }
							],
							"conclusion": "Vậy A = x^2 - 1"
						}
					]
				}
			],
			"diagrams": [
				{
					"image_index": 0,
					"box_2d": [100, 100, 800, 800],
					"placeholder": "[DIAGRAM_0_1]"
				}
			]
		}
	]`

	processedJson, err := ParseAndProcessExtractedLecture(rawJson, []image.Image{mockImg}, tempDir)
	if err != nil {
		t.Fatalf("ParseAndProcessExtractedLecture failed: %v", err)
	}

	if !strings.Contains(processedJson, "/uploads/temp/") || !strings.Contains(processedJson, "<img") {
		t.Errorf("Expected placeholder [DIAGRAM_0_1] to be replaced with <img> tag, got: %s", processedJson)
	}
	if strings.Contains(processedJson, "[DIAGRAM_0_1]") {
		t.Errorf("Did not expect placeholder to remain in output JSON")
	}
}
