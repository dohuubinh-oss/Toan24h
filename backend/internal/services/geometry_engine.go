package services

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
)

// GeometrySegment represents a straight line segment between two named points
type GeometrySegment struct {
	From        string  `json:"from"`
	To          string  `json:"to"`
	Style       string  `json:"style,omitempty"`        // "solid" | "dashed"
	Color       string  `json:"color,omitempty"`        // e.g. "#0f172a", "#2563eb", "#059669"
	StrokeWidth float64 `json:"stroke_width,omitempty"` // default 2.5 for solid, 2.0 for dashed
	Label       string  `json:"label,omitempty"`        // e.g. "6 cm", "8 cm", "a", "x"
}

// GeometryRightAngle represents a right-angle marker at vertex between arm1 and arm2
type GeometryRightAngle struct {
	Vertex string `json:"vertex"`
	Arm1   string `json:"arm1"`
	Arm2   string `json:"arm2"`
	Size   float64 `json:"size,omitempty"` // default 14px
}

// GeometryCircle represents a circle in the Cartesian plane
type GeometryCircle struct {
	Center      string  `json:"center"`           // Name of point or "x,y"
	Radius      float64 `json:"radius"`           // Radius in Oxy units
	Style       string  `json:"style,omitempty"`  // "solid" | "dashed"
	Color       string  `json:"color,omitempty"`  // e.g. "#0f172a"
	StrokeWidth float64 `json:"stroke_width,omitempty"`
}

// GeometryModel is the clean, declarative Cartesian Oxy geometry representation
type GeometryModel struct {
	ShowAxes    bool                       `json:"show_axes,omitempty"`
	Points      map[string][2]float64      `json:"points"`
	Segments    []GeometrySegment          `json:"segments"`
	RightAngles []GeometryRightAngle       `json:"right_angles,omitempty"`
	Circles     []GeometryCircle           `json:"circles,omitempty"`
	Labels      map[string]string          `json:"labels,omitempty"`     // Custom text label per point
	Directions  map[string]string          `json:"directions,omitempty"` // "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"
}

// ParseAndRenderGeometryJSON checks if the raw string contains a valid GeometryModel JSON.
// If valid and contains points, it renders it into a pixel-perfect SVG string.
func ParseAndRenderGeometryJSON(raw string) (string, bool) {
	cleaned := strings.TrimSpace(raw)
	// Strip markdown code fences if present
	if strings.Contains(cleaned, "```") {
		start := strings.Index(cleaned, "{")
		end := strings.LastIndex(cleaned, "}")
		if start != -1 && end != -1 && end > start {
			cleaned = cleaned[start : end+1]
		}
	}

	var model GeometryModel
	if err := json.Unmarshal([]byte(cleaned), &model); err != nil {
		// Try unmarshaling if wrapped
		var wrapper struct {
			GeometryModel *GeometryModel `json:"geometry_model"`
			Geometry      *GeometryModel `json:"geometry"`
			Diagram       *GeometryModel `json:"diagram"`
			Model         *GeometryModel `json:"model"`
		}
		if errWrap := json.Unmarshal([]byte(cleaned), &wrapper); errWrap != nil {
			return "", false
		}
		if wrapper.GeometryModel != nil {
			model = *wrapper.GeometryModel
		} else if wrapper.Geometry != nil {
			model = *wrapper.Geometry
		} else if wrapper.Diagram != nil {
			model = *wrapper.Diagram
		} else if wrapper.Model != nil {
			model = *wrapper.Model
		} else {
			return "", false
		}
	} else if len(model.Points) == 0 {
		var wrapper struct {
			GeometryModel *GeometryModel `json:"geometry_model"`
			Geometry      *GeometryModel `json:"geometry"`
			Diagram       *GeometryModel `json:"diagram"`
			Model         *GeometryModel `json:"model"`
		}
		if errWrap := json.Unmarshal([]byte(cleaned), &wrapper); errWrap == nil {
			if wrapper.GeometryModel != nil {
				model = *wrapper.GeometryModel
			} else if wrapper.Geometry != nil {
				model = *wrapper.Geometry
			} else if wrapper.Diagram != nil {
				model = *wrapper.Diagram
			} else if wrapper.Model != nil {
				model = *wrapper.Model
			}
		}
	}

	if len(model.Points) == 0 {
		return "", false
	}

	svg, err := RenderGeometryModelToSVG(model)
	if err != nil {
		return "", false
	}

	return svg, true
}

// RenderGeometryModelToSVG converts a Cartesian Oxy GeometryModel into textbook-standard SVG
func RenderGeometryModelToSVG(model GeometryModel) (string, error) {
	if len(model.Points) == 0 {
		return "", fmt.Errorf("no points provided in geometry model")
	}

	// 1. Calculate bounding box of all points and circles in Oxy coordinates
	minX := math.MaxFloat64
	maxX := -math.MaxFloat64
	minY := math.MaxFloat64
	maxY := -math.MaxFloat64

	for _, pt := range model.Points {
		if pt[0] < minX {
			minX = pt[0]
		}
		if pt[0] > maxX {
			maxX = pt[0]
		}
		if pt[1] < minY {
			minY = pt[1]
		}
		if pt[1] > maxY {
			maxY = pt[1]
		}
	}

	// Expand bbox with circles
	for _, c := range model.Circles {
		if pt, ok := model.Points[c.Center]; ok {
			r := c.Radius
			if pt[0]-r < minX {
				minX = pt[0] - r
			}
			if pt[0]+r > maxX {
				maxX = pt[0] + r
			}
			if pt[1]-r < minY {
				minY = pt[1] - r
			}
			if pt[1]+r > maxY {
				maxY = pt[1] + r
			}
		}
	}

	// Avoid division by zero when all points coincide
	if maxX-minX < 0.001 {
		minX -= 1
		maxX += 1
	}
	if maxY-minY < 0.001 {
		minY -= 1
		maxY += 1
	}

	// 2. ViewBox parameters
	const canvasW = 600.0
	const canvasH = 500.0
	const padX = 55.0
	const padY = 50.0

	availW := canvasW - 2*padX
	availH := canvasH - 2*padY

	spanX := maxX - minX
	spanY := maxY - minY

	scaleX := availW / spanX
	scaleY := availH / spanY
	scale := math.Min(scaleX, scaleY)

	centerX := (minX + maxX) / 2.0
	centerY := (minY + maxY) / 2.0

	// Helper: Project Cartesian Oxy point (x, y) to SVG (X_svg, Y_svg)
	project := func(x, y float64) (float64, float64) {
		svgX := (canvasW / 2.0) + scale*(x-centerX)
		svgY := (canvasH / 2.0) - scale*(y-centerY) // Inverted Y axis
		return svgX, svgY
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`<svg viewBox="0 0 %.0f %.0f" width="100%%" height="auto" xmlns="http://www.w3.org/2000/svg">`+"\n", canvasW, canvasH))

	// 3. Render Cartesian Axes if requested
	if model.ShowAxes {
		ox, oy := project(0, 0)
		sb.WriteString(`  <!-- Coordinate Axes Oxy -->` + "\n")
		sb.WriteString(`  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
    </marker>
  </defs>` + "\n")
		// X axis
		sb.WriteString(fmt.Sprintf(`  <line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrow)"/>`+"\n", padX/2, oy, canvasW-padX/2, oy))
		sb.WriteString(fmt.Sprintf(`  <text x="%.1f" y="%.1f" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#64748b">x</text>`+"\n", canvasW-padX/2+8, oy+5))

		// Y axis
		sb.WriteString(fmt.Sprintf(`  <line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrow)"/>`+"\n", ox, canvasH-padY/2, ox, padY/2))
		sb.WriteString(fmt.Sprintf(`  <text x="%.1f" y="%.1f" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#64748b">y</text>`+"\n", ox-5, padY/2-8))

		// Origin label O
		sb.WriteString(fmt.Sprintf(`  <text x="%.1f" y="%.1f" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-style="italic" fill="#64748b">O</text>`+"\n", ox-14, oy+16))
	}

	// 4. Render Circles
	for _, c := range model.Circles {
		pt, ok := model.Points[c.Center]
		if !ok {
			continue
		}
		cx, cy := project(pt[0], pt[1])
		r := c.Radius * scale

		strokeColor := c.Color
		if strokeColor == "" {
			strokeColor = "#0f172a"
		}
		strokeW := c.StrokeWidth
		if strokeW <= 0 {
			strokeW = 2.0
		}
		dashAttr := ""
		if strings.EqualFold(c.Style, "dashed") {
			dashAttr = ` stroke-dasharray="6,4"`
		}

		sb.WriteString(fmt.Sprintf(`  <circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="%s" stroke-width="%.1f"%s/>`+"\n",
			cx, cy, r, strokeColor, strokeW, dashAttr))
	}

	// 5. Render Right-Angle Markers
	for _, ra := range model.RightAngles {
		vPt, okV := model.Points[ra.Vertex]
		a1Pt, ok1 := model.Points[ra.Arm1]
		a2Pt, ok2 := model.Points[ra.Arm2]
		if !okV || !ok1 || !ok2 {
			continue
		}

		vx, vy := project(vPt[0], vPt[1])
		x1, y1 := project(a1Pt[0], a1Pt[1])
		x2, y2 := project(a2Pt[0], a2Pt[1])

		// Unit vector from V to Arm 1
		d1x, d1y := x1-vx, y1-vy
		len1 := math.Hypot(d1x, d1y)
		if len1 < 0.001 {
			continue
		}
		u1x, u1y := d1x/len1, d1y/len1

		// Unit vector from V to Arm 2
		d2x, d2y := x2-vx, y2-vy
		len2 := math.Hypot(d2x, d2y)
		if len2 < 0.001 {
			continue
		}
		u2x, u2y := d2x/len2, d2y/len2

		size := ra.Size
		if size <= 0 {
			size = 14.0
		}

		// Corner points for the square marker
		p1x := vx + size*u1x
		p1y := vy + size*u1y
		p2x := vx + size*u1x + size*u2x
		p2y := vy + size*u1y + size*u2y
		p3x := vx + size*u2x
		p3y := vy + size*u2y

		sb.WriteString(fmt.Sprintf(`  <path d="M %.1f %.1f L %.1f %.1f L %.1f %.1f" fill="none" stroke="#0f172a" stroke-width="1.5"/>`+"\n",
			p1x, p1y, p2x, p2y, p3x, p3y))
	}

	// 6. Render Segments
	for _, seg := range model.Segments {
		p1, ok1 := model.Points[seg.From]
		p2, ok2 := model.Points[seg.To]
		if !ok1 || !ok2 {
			continue
		}

		x1, y1 := project(p1[0], p1[1])
		x2, y2 := project(p2[0], p2[1])

		color := seg.Color
		strokeW := seg.StrokeWidth
		dashAttr := ""

		if strings.EqualFold(seg.Style, "dashed") {
			if color == "" {
				color = "#2563eb"
			}
			if strokeW <= 0 {
				strokeW = 2.0
			}
			dashAttr = ` stroke-dasharray="6,4"`
		} else {
			if color == "" {
				color = "#0f172a"
			}
			if strokeW <= 0 {
				strokeW = 2.5
			}
		}

		sb.WriteString(fmt.Sprintf(`  <line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%.1f"%s/>`+"\n",
			x1, y1, x2, y2, color, strokeW, dashAttr))

		if seg.Label != "" {
			midX := (x1 + x2) / 2.0
			midY := (y1 + y2) / 2.0
			dx := x2 - x1
			dy := y2 - y1
			lenSeg := math.Hypot(dx, dy)
			var nx, ny float64
			if lenSeg > 0.001 {
				// Normal vector pointing outward
				nx = -dy / lenSeg
				ny = dx / lenSeg
			}
			lblX := midX + 11*nx
			lblY := midY + 11*ny
			sb.WriteString(fmt.Sprintf(`  <text x="%.1f" y="%.1f" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#475569" text-anchor="middle" paint-order="stroke" stroke="#ffffff" stroke-width="3">%s</text>`+"\n",
				lblX, lblY+4, seg.Label))
		}
	}

	// 7. Render Point Dots
	for _, pt := range model.Points {
		px, py := project(pt[0], pt[1])
		sb.WriteString(fmt.Sprintf(`  <circle cx="%.1f" cy="%.1f" r="3.5" fill="#0f172a"/>`+"\n", px, py))
	}

	// 8. Render Labels with Anti-Collision Placement
	// Build map of connected vectors to compute automatic outward offset
	connectedVectors := make(map[string][][2]float64)
	for _, seg := range model.Segments {
		p1, ok1 := model.Points[seg.From]
		p2, ok2 := model.Points[seg.To]
		if !ok1 || !ok2 {
			continue
		}
		x1, y1 := project(p1[0], p1[1])
		x2, y2 := project(p2[0], p2[1])

		dx, dy := x2-x1, y2-y1
		l := math.Hypot(dx, dy)
		if l > 0.001 {
			connectedVectors[seg.From] = append(connectedVectors[seg.From], [2]float64{dx / l, dy / l})
			connectedVectors[seg.To] = append(connectedVectors[seg.To], [2]float64{-dx / l, -dy / l})
		}
	}

	for name, pt := range model.Points {
		px, py := project(pt[0], pt[1])

		labelText := name
		if custom, ok := model.Labels[name]; ok && custom != "" {
			labelText = custom
		}

		// Calculate label offset
		var offsetX, offsetY float64
		textAnchor := "middle"

		if dir, ok := model.Directions[name]; ok {
			switch strings.ToLower(dir) {
			case "top":
				offsetX, offsetY = 0, -12
				textAnchor = "middle"
			case "bottom":
				offsetX, offsetY = 0, 16
				textAnchor = "middle"
			case "left":
				offsetX, offsetY = -14, 4
				textAnchor = "end"
			case "right":
				offsetX, offsetY = 14, 4
				textAnchor = "start"
			case "top-left":
				offsetX, offsetY = -12, -10
				textAnchor = "end"
			case "top-right":
				offsetX, offsetY = 12, -10
				textAnchor = "start"
			case "bottom-left":
				offsetX, offsetY = -12, 14
				textAnchor = "end"
			case "bottom-right":
				offsetX, offsetY = 12, 14
				textAnchor = "start"
			default:
				offsetX, offsetY = 0, -12
				textAnchor = "middle"
			}
		} else {
			// Automatic outward vector calculation
			vecs := connectedVectors[name]
			if len(vecs) > 0 {
				var sumX, sumY float64
				for _, v := range vecs {
					sumX += v[0]
					sumY += v[1]
				}
				lenSum := math.Hypot(sumX, sumY)
				if lenSum > 0.001 {
					// Opposite of the sum of connected arm vectors points outward!
					outX := -sumX / lenSum
					outY := -sumY / lenSum
					offsetX = outX * 15.0
					offsetY = outY * 15.0

					if outX > 0.3 {
						textAnchor = "start"
					} else if outX < -0.3 {
						textAnchor = "end"
					} else {
						textAnchor = "middle"
					}
				} else {
					// Perfectly collinear, offset vertically
					offsetX, offsetY = 0, -14
					textAnchor = "middle"
				}
			} else {
				// Isolated point
				offsetX, offsetY = 0, -12
				textAnchor = "middle"
			}
		}

		sb.WriteString(fmt.Sprintf(`  <text x="%.1f" y="%.1f" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="%s">%s</text>`+"\n",
			px+offsetX, py+offsetY+4, textAnchor, labelText))
	}

	sb.WriteString("</svg>")
	return sb.String(), nil
}
