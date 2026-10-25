package services

import (
	"strings"
	"testing"
)

func TestRenderGeometryModelToSVG_RightTriangle(t *testing.T) {
	model := GeometryModel{
		Points: map[string][2]float64{
			"A": {0, 0},
			"B": {0, 6},
			"C": {8, 0},
		},
		Segments: []GeometrySegment{
			{From: "A", To: "B", Style: "solid"},
			{From: "B", To: "C", Style: "solid"},
			{From: "C", To: "A", Style: "solid"},
		},
		RightAngles: []GeometryRightAngle{
			{Vertex: "A", Arm1: "B", Arm2: "C"},
		},
	}

	svg, err := RenderGeometryModelToSVG(model)
	if err != nil {
		t.Fatalf("RenderGeometryModelToSVG failed: %v", err)
	}

	// 1. Verify SVG structure
	if !strings.HasPrefix(svg, `<svg viewBox="0 0 600 500"`) {
		t.Errorf("SVG missing expected viewBox header: %s", svg[:50])
	}
	if !strings.HasSuffix(svg, `</svg>`) {
		t.Errorf("SVG missing closing tag")
	}

	// 2. Verify all labels exist
	for _, ptName := range []string{"A", "B", "C"} {
		if !strings.Contains(svg, ">"+ptName+"</text>") {
			t.Errorf("SVG missing label for point %s", ptName)
		}
	}

	// 3. Verify right angle marker is rendered
	if !strings.Contains(svg, `<path d="M`) {
		t.Errorf("SVG missing right-angle square marker path")
	}

	// 4. Verify line segments are rendered
	if strings.Count(svg, "<line") < 3 {
		t.Errorf("Expected at least 3 line segments, got %d", strings.Count(svg, "<line"))
	}
}

func TestRenderGeometryModelToSVG_CirclesAndAxes(t *testing.T) {
	model := GeometryModel{
		ShowAxes: true,
		Points: map[string][2]float64{
			"O": {0, 0},
			"M": {3, 4},
		},
		Circles: []GeometryCircle{
			{Center: "O", Radius: 5, Style: "solid"},
		},
		Segments: []GeometrySegment{
			{From: "O", To: "M", Style: "dashed"},
		},
	}

	svg, err := RenderGeometryModelToSVG(model)
	if err != nil {
		t.Fatalf("RenderGeometryModelToSVG failed: %v", err)
	}

	// Verify circle exists
	if !strings.Contains(svg, "<circle") {
		t.Errorf("SVG missing circle element")
	}

	// Verify dashed segment
	if !strings.Contains(svg, `stroke-dasharray="6,4"`) {
		t.Errorf("SVG missing dashed line styling")
	}

	// Verify coordinate axes
	if !strings.Contains(svg, "<!-- Coordinate Axes Oxy -->") {
		t.Errorf("SVG missing Oxy axes marker")
	}
	if !strings.Contains(svg, ">x</text>") || !strings.Contains(svg, ">y</text>") {
		t.Errorf("SVG missing x or y axis label")
	}
}

func TestRenderGeometryModelToSVG_EmptyPoints(t *testing.T) {
	model := GeometryModel{}
	_, err := RenderGeometryModelToSVG(model)
	if err == nil {
		t.Errorf("Expected error for empty points model, got nil")
	}
}

func TestParseAndRenderGeometryJSON(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		expectSVG bool
	}{
		{
			name: "Direct GeometryModel JSON",
			raw: `{
				"points": {
					"A": [0, 0],
					"B": [0, 5],
					"C": [6, 0]
				},
				"segments": [
					{"from": "A", "to": "B"},
					{"from": "B", "to": "C"},
					{"from": "C", "to": "A"}
				],
				"right_angles": [
					{"vertex": "A", "arm1": "B", "arm2": "C"}
				]
			}`,
			expectSVG: true,
		},
		{
			name: "Markdown code fenced JSON",
			raw: "```json\n" + `{
				"points": {
					"A": [0, 0],
					"B": [4, 4]
				},
				"segments": [
					{"from": "A", "to": "B"}
				]
			}` + "\n```",
			expectSVG: true,
		},
		{
			name: "Wrapped in geometry_model field",
			raw: `{
				"geometry_model": {
					"points": {
						"A": [0, 0],
						"B": [0, 3],
						"C": [4, 0]
					},
					"segments": [
						{"from": "A", "to": "B"},
						{"from": "B", "to": "C"},
						{"from": "C", "to": "A"}
					]
				}
			}`,
			expectSVG: true,
		},
		{
			name:      "Invalid JSON string",
			raw:       `Not a valid json at all`,
			expectSVG: false,
		},
		{
			name:      "Empty points",
			raw:       `{"points": {}}`,
			expectSVG: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svg, ok := ParseAndRenderGeometryJSON(tt.raw)
			if ok != tt.expectSVG {
				t.Fatalf("ParseAndRenderGeometryJSON() ok = %v, want %v", ok, tt.expectSVG)
			}
			if tt.expectSVG {
				if !strings.Contains(svg, "<svg") || !strings.Contains(svg, "</svg>") {
					t.Errorf("Generated SVG does not contain valid <svg> tags: %s", svg)
				}
			}
		})
	}
}

func TestRenderGeometryModelToSVG_ProblemAndSolutionElements(t *testing.T) {
	// Tam giác vuông ABC có đường cao AH dựng thêm trong lời giải
	rawJson := `{
		"points": {
			"A": [0, 0],
			"B": [0, 6],
			"C": [8, 0],
			"H": [2.88, 3.84]
		},
		"segments": [
			{"from": "A", "to": "B", "style": "solid", "label": "6 cm", "color": "#0f172a"},
			{"from": "B", "to": "C", "style": "solid", "color": "#0f172a"},
			{"from": "C", "to": "A", "style": "solid", "label": "8 cm", "color": "#0f172a"},
			{"from": "A", "to": "H", "style": "dashed", "color": "#2563eb", "label": "h"}
		],
		"right_angles": [
			{"vertex": "A", "arm1": "B", "arm2": "C"},
			{"vertex": "H", "arm1": "A", "arm2": "C"}
		]
	}`

	svg, ok := ParseAndRenderGeometryJSON(rawJson)
	if !ok || svg == "" {
		t.Fatalf("Failed to parse and render geometry JSON")
	}

	// 1. Kiểm tra nhãn cạnh đề bài và nhãn đường cao lời giải
	if !strings.Contains(svg, ">6 cm</text>") {
		t.Errorf("SVG missing label '6 cm'")
	}
	if !strings.Contains(svg, ">8 cm</text>") {
		t.Errorf("SVG missing label '8 cm'")
	}
	if !strings.Contains(svg, ">h</text>") {
		t.Errorf("SVG missing label 'h'")
	}

	// 2. Kiểm tra nét đứt của đường cao AH trong lời giải
	if !strings.Contains(svg, `stroke="#2563eb"`) {
		t.Errorf("SVG missing solution color #2563eb")
	}
	if !strings.Contains(svg, `stroke-dasharray="6,4"`) {
		t.Errorf("SVG missing dashed line for solution line AH")
	}

	// 3. Kiểm tra ký hiệu vuông góc cho cả A (đề bài) và H (lời giải)
	rightAnglePaths := strings.Count(svg, `fill="none" stroke=`)
	if rightAnglePaths < 2 {
		t.Errorf("Expected at least 2 right angle markers, got %d", rightAnglePaths)
	}
}

func TestParseAndRenderGeometryJSON_FlexibleFormats(t *testing.T) {
	// Raw JSON where segments are arrays of strings ["A", "B"] and points have {x, y}
	rawJson := `{
		"points": {
			"A": {"x": 0, "y": 0},
			"B": [0, 6],
			"C": [8, 0],
			"H": [2.88, 3.84]
		},
		"segments": [
			["A", "B"],
			["B", "C"],
			["C", "A"],
			{"from": "A", "to": "H", "style": "dashed", "color": "#2563eb"}
		],
		"right_angles": [
			{"vertex": "A", "arm1": "B", "arm2": "C"}
		]
	}`

	svg, ok := ParseAndRenderGeometryJSON(rawJson)
	if !ok || svg == "" {
		t.Fatalf("Failed to parse flexible geometry JSON")
	}

	if !strings.Contains(svg, ">A</text>") || !strings.Contains(svg, ">B</text>") || !strings.Contains(svg, ">H</text>") {
		t.Errorf("SVG missing point labels")
	}
	if strings.Count(svg, "<line") < 4 {
		t.Errorf("Expected 4 lines rendered from mixed segment formats, got %d", strings.Count(svg, "<line"))
	}
}

