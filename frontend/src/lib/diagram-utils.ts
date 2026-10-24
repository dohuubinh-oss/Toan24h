export function stripDiagramSvgBackground(svg: string): string {
  if (!svg) return svg;
  // Remove full-canvas background rects (e.g., <rect width="600" height="500" fill="#ffffff" rx="12"/>)
  return svg.replace(/<\s*rect\s+[^>]*fill=["'](?:#ffffff|white|#fff)["'][^>]*\/?>\s*/gi, '');
}

export function extractDiagramSvg(rawDiagram: any, solutionGuide?: any): string | null {
  const parseCandidate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'object') {
      if (val.diagram_svg && typeof val.diagram_svg === 'string') return parseCandidate(val.diagram_svg);
      if (val.diagramSvg && typeof val.diagramSvg === 'string') return parseCandidate(val.diagramSvg);
      if (val.url && typeof val.url === 'string') return parseCandidate(val.url);
      return null;
    }
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s || s === 'null' || s === 'undefined' || s === 'none' || s === '[]' || s === '{}') return null;

      // Check if it's a JSON string containing diagram_svg / url
      if (s.startsWith('{') && (s.includes('diagram_svg') || s.includes('diagramSvg') || s.includes('url'))) {
        try {
          const parsed = JSON.parse(s);
          const res = parseCandidate(parsed);
          if (res) return res;
        } catch (e) {}
      }

      // Check if it's markdown wrapped SVG
      if (s.includes('```')) {
        const match = s.match(/```(?:xml|svg)?\s*([\s\S]*?)\s*```/i);
        if (match && match[1]) {
          const inner = match[1].trim();
          const svgStart = inner.indexOf('<svg');
          const svgEnd = inner.lastIndexOf('</svg>');
          if (svgStart !== -1 && svgEnd !== -1 && svgEnd > svgStart) {
            return stripDiagramSvgBackground(inner.substring(svgStart, svgEnd + 6));
          }
        }
      }

      // Check if it contains an SVG tag
      const svgStart = s.indexOf('<svg');
      const svgEnd = s.lastIndexOf('</svg>');
      if (svgStart !== -1 && svgEnd !== -1 && svgEnd > svgStart) {
        return stripDiagramSvgBackground(s.substring(svgStart, svgEnd + 6));
      }

      // Check if it's a valid Image URL or relative path
      const isImageUrl = (
        s.startsWith('http://') || 
        s.startsWith('https://') || 
        s.startsWith('/') || 
        s.startsWith('uploads/') || 
        s.startsWith('data:image/')
      );

      if (isImageUrl) {
        return s;
      }

      // Text without SVG or image URL is NOT a diagram
      return null;
    }
    return null;
  };

  const fromRaw = parseCandidate(rawDiagram);
  if (fromRaw) return fromRaw;

  const fromSolution = parseCandidate(solutionGuide);
  if (fromSolution) return fromSolution;

  return null;
}
