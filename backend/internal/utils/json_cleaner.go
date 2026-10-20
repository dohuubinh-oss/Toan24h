package utils

import (
	"strings"
)

// latexTKeywords contains LaTeX command names starting with 't' that should not be swallowed as JSON \t (tab).
var latexTKeywords = []string{
	"textbf", "textit", "texttt", "textrm", "textsc", "textsf", "textmd", "textup", "textcolor", "text",
	"times", "theta", "Theta", "tan", "tanh", "tau", "trianglelefteq", "trianglerighteq", "triangleq", "triangle",
	"to", "tilde", "top", "tfrac", "tag", "tiny", "therefore", "thicksim", "thickapprox",
	"twoheadrightarrow", "twoheadleftarrow",
}

// latexNKeywords contains LaTeX command names starting with 'n' that should not be swallowed as JSON \n (newline).
var latexNKeywords = []string{
	"normalsize", "natural", "nexists", "nearrow", "nwarrow", "notin", "nabla",
	"nvdash", "nvDash", "nprec", "nsucc", "neq", "not", "nu", "ni", "ne",
}

func isHex(b byte) bool {
	return (b >= '0' && b <= '9') || (b >= 'a' && b <= 'f') || (b >= 'A' && b <= 'F')
}

func isLetter(b byte) bool {
	return (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
}

func matchesLatexKeyword(s string, keywords []string) bool {
	for _, kw := range keywords {
		if strings.HasPrefix(s, kw) {
			// In LaTeX, the command word ends when a non-letter is encountered (e.g. space, {, \, $, etc.)
			if len(s) == len(kw) || !isLetter(s[len(kw)]) {
				return true
			}
		}
	}
	return false
}

// ExtractJSON strips markdown fences and extracts the outermost JSON object or array.
func ExtractJSON(raw string) string {
	s := strings.TrimSpace(raw)

	// Strip markdown code fences if present
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
	}
	s = strings.TrimSuffix(s, "```")
	s = strings.TrimSpace(s)

	// Find the outermost JSON boundary: either [...] or {...}
	firstBracket := strings.Index(s, "[")
	firstBrace := strings.Index(s, "{")

	first := -1
	if firstBracket != -1 && (firstBrace == -1 || firstBracket < firstBrace) {
		first = firstBracket
	} else if firstBrace != -1 {
		first = firstBrace
	}

	lastBracket := strings.LastIndex(s, "]")
	lastBrace := strings.LastIndex(s, "}")

	last := -1
	if lastBracket != -1 && (lastBrace == -1 || lastBracket > lastBrace) {
		last = lastBracket
	} else if lastBrace != -1 {
		last = lastBrace
	}

	if first != -1 && last != -1 && first < last {
		return s[first : last+1]
	}

	return s
}

// SanitizeJSON cleans raw JSON text from LLMs (such as Gemini Vision) by:
// 1. Extracting the JSON body from markdown or conversational fluff.
// 2. Fixing invalid JSON escape sequences (e.g. unescaped LaTeX backslashes \quad, \sqrt, \pm, \{, \}, etc.).
// 3. Ensuring LaTeX commands like \frac, \text, \neq are not misparsed into control characters (\f, \t, \n).
// 4. Removing trailing commas before closing braces/brackets.
// 5. Escaping literal unescaped newlines/tabs inside string literals.
func SanitizeJSON(raw string) string {
	extracted := ExtractJSON(raw)
	return SanitizeJSONEscapes(extracted)
}

// SanitizeJSONEscapes repairs escape sequences and syntax inside JSON text.
func SanitizeJSONEscapes(input string) string {
	var sb strings.Builder
	sb.Grow(len(input) + 64)

	inString := false
	n := len(input)

	for i := 0; i < n; i++ {
		c := input[i]

		if !inString {
			if c == '"' {
				inString = true
				sb.WriteByte(c)
			} else if c == ',' {
				// Check for trailing comma before '}' or ']'
				j := i + 1
				for j < n && (input[j] == ' ' || input[j] == '\t' || input[j] == '\n' || input[j] == '\r') {
					j++
				}
				if j < n && (input[j] == '}' || input[j] == ']') {
					// Trailing comma found, omit it
					continue
				}
				sb.WriteByte(c)
			} else {
				sb.WriteByte(c)
			}
			continue
		}

		// We are inside a JSON string
		if c == '"' {
			inString = false
			sb.WriteByte(c)
		} else if c == '\n' || c == '\r' {
			// Literal newline inside JSON string is illegal in RFC 8259
			if c == '\r' && i+1 < n && input[i+1] == '\n' {
				i++
			}
			sb.WriteString(`\n`)
		} else if c == '\t' {
			// Literal tab inside JSON string
			sb.WriteString(`\t`)
		} else if c == '\\' {
			// Backslash encountered
			if i+1 >= n {
				// Trailing backslash at end of input
				sb.WriteString(`\\`)
				break
			}

			next := input[i+1]
			switch next {
			case '"', '\\', '/':
				// Valid standard JSON escapes
				sb.WriteByte('\\')
				sb.WriteByte(next)
				i++
			case 'u':
				// Unicode escape: \uXXXX
				if i+5 < n && isHex(input[i+2]) && isHex(input[i+3]) && isHex(input[i+4]) && isHex(input[i+5]) {
					sb.WriteByte('\\')
					sb.WriteByte('u')
					i++
				} else {
					// Not a valid hex unicode escape (e.g. \underline, \uparrow)
					sb.WriteString(`\\`)
				}
			case 'f', 'b':
				// \f (formfeed) and \b (backspace) are control characters never meant for educational text,
				// but heavily used in LaTeX (\frac, \beta, \bar, \begin, etc.).
				if i+2 < n && isLetter(input[i+2]) {
					sb.WriteString(`\\`)
				} else {
					sb.WriteByte('\\')
					sb.WriteByte(next)
					i++
				}
			case 'r':
				// \r (carriage return) - if followed by \n, preserve \r\n. If followed by letter (\right, \rho), escape.
				if i+2 < n && isLetter(input[i+2]) {
					sb.WriteString(`\\`)
				} else {
					sb.WriteByte('\\')
					sb.WriteByte(next)
					i++
				}
			case 't':
				// \t (tab) - check if this is a LaTeX command starting with 't' (\text, \times, \theta, \tan, etc.)
				if matchesLatexKeyword(input[i+1:], latexTKeywords) {
					sb.WriteString(`\\`)
				} else {
					sb.WriteByte('\\')
					sb.WriteByte(next)
					i++
				}
			case 'n':
				// \n (newline) - check if this is a LaTeX command starting with 'n' (\neq, \notin, \nabla, etc.)
				if matchesLatexKeyword(input[i+1:], latexNKeywords) {
					sb.WriteString(`\\`)
				} else {
					sb.WriteByte('\\')
					sb.WriteByte(next)
					i++
				}
			default:
				// Any other character after '\' (e.g. \q, \s, \p, \a, \l, \c, \d, \g, \m, \v, \i, \o, \w, \x, \z, \{, \}, \[, \], etc.)
				// is strictly an INVALID JSON escape sequence. Escape the backslash to make it a literal backslash.
				sb.WriteString(`\\`)
			}
		} else {
			sb.WriteByte(c)
		}
	}

	return sb.String()
}
