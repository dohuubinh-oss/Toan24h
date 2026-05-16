---
name: Modern Academic (Editorial Scholarship)
description: A high-fidelity design system for professional examination management. Focuses on clarity, authority, and focused learning through strong typography and generous whitespace.
colors:
  surface: "#FFFFFF"
  on-surface: "#1E293B"
  on-surface-variant: "#64748B"
  primary: "#334155"
  on-primary: "#F8FAFC"
  primary-container: "#F1F5F9"
  on-primary-container: "#475569"
  secondary: "#0F172A"
  on-secondary: "#FFFFFF"
  accent: "#475569"
  on-accent: "#FFFFFF"
  error: "#991B1B"
  on-error: "#FEF2F2"
  background: "#F8FAFC"
  on-background: "#1E293B"
  outline: "#E2E8F0"
  outline-variant: "#F1F5F9"
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  card-gap: 24px
  section-margin: 48px
components:
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.container-padding}"
    border: "none"
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
  input-field:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    border: "1px solid {colors.outline}"
---

# Brand & Style
The **Modern Academic** design system is built for the "ExamModel" project. It follows the **Editorial Scholarship** philosophy: priority is given to reading and focus. The aesthetic is clean, authoritative, and sophisticated, mirroring the environment of a premium educational institution or a professional broadsheet.

## Core Principles
1. **Typography First**: Hierarchy is established through weight and size of Lexend (headings) and Inter (body), not through color or boxes.
2. **Infinite Whitespace**: Margins and gaps are intentionally large to create "breathing room" for complex exam data.
3. **No-Line Architecture**: Borders and lines are replaced by subtle depth (shadows) and background shifts to define sections.
4. **Slate Authority**: A palette of Slate and Ink blues provides a serious, professional tone that is easier on the eyes than pure black.

# Colors
The color strategy uses a high-contrast Light Mode only approach.
- **Background**: We use a very light slate (#F8FAFC) instead of pure white for the main canvas to reduce glare.
- **Cards**: Pure white cards sit on the background, creating a natural elevation.
- **Accents**: Used sparingly for interactive elements to keep the focus on the academic content.

# Typography
We use two Google Fonts:
- **Lexend**: A font specifically designed to improve reading proficiency. Used for all headings and brand elements.
- **Inter**: A highly legible sans-serif for UI labels and long-form body text.

# Elevation & Depth
Depth is achieved through **Soft Layering**:
- **Level 1 (Canvas)**: Background color.
- **Level 2 (Content)**: Surface cards with soft shadows.
- **Level 3 (Interactions)**: Primary buttons and active states with a slightly deeper shadow or high-contrast color.

# Layout
- **Grid**: 8px base unit.
- **Margins**: 32px container padding is the standard minimum.
- **Density**: Low density is preferred. Information should be chunked into clean sections rather than crammed into a single view.
