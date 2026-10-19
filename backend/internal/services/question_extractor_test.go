package services

import (
	"image"
	"image/color"
	"image/draw"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseAndProcessExtractedBlocks(t *testing.T) {
	tempDir := "./uploads/temp"
	defer os.RemoveAll(tempDir)

	// Create 1 synthetic image 300x300
	img := image.NewRGBA(image.Rect(0, 0, 300, 300))
	draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{0, 255, 0, 255}}, image.Point{}, draw.Src)
	images := []image.Image{img}

	rawJSON := `[
		{
			"shared_content": "Cho hình chóp S.ABC [DIAGRAM_0_1]",
			"is_group": true,
			"questions": [
				{
					"type_question": "single",
					"content": "Tính thể tích khối chóp",
					"type": "Trắc nghiệm",
					"options": ["A. $V = \\frac{1}{3}Bh$", "B. $V = Bh$"],
					"correct_answer": "A",
					"solution_guide": "Áp dụng công thức $V = \\frac{1}{3}Bh$"
				}
			],
			"diagrams": [
				{
					"image_index": 0,
					"box_2d": [100, 100, 400, 400],
					"placeholder": "[DIAGRAM_0_1]"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, images, tempDir)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)

	// Verify placeholder was replaced by an <img> tag with /uploads/temp/ URL
	assert.True(t, strings.Contains(blocks[0].SharedContent, `<img src="/uploads/temp/`))
	assert.False(t, strings.Contains(blocks[0].SharedContent, `[DIAGRAM_0_1]`))
}

func TestParseAndProcessExtractedBlocks_WithoutDiagrams(t *testing.T) {
	tempDir := "./uploads/temp"
	rawJSON := `[
		{
			"shared_content": "",
			"is_group": false,
			"questions": [
				{
					"type_question": "single",
					"content": "Giải phương trình $x^2 - 4 = 0$",
					"type": "Tự luận",
					"options": [],
					"correct_answer": "$x = \\pm 2$",
					"solution_guide": "Ta có $x^2 = 4 \\Rightarrow x = \\pm 2$"
				}
			]
		}
	]`

	blocks, err := ParseAndProcessExtractedBlocks(rawJSON, nil, tempDir)
	assert.NoError(t, err)
	assert.Len(t, blocks, 1)
	assert.Equal(t, "Giải phương trình $x^2 - 4 = 0$", blocks[0].Questions[0].Content)
}
