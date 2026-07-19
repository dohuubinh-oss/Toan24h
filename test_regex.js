const html = "Cho tam giác ABC.Kẻ đường cao AH; đường phân giác AD. Ta có 3.14 và VD. XYZ. <br> <math-inline>x.y</math-inline> abc; def.";

const placeholders = [];

// Protect math
let processed = html.replace(/<math-inline[^>]*>.*?<\/math-inline>/gi, (match) => {
  placeholders.push(match);
  return `__MATH_PLACEHOLDER_${placeholders.length - 1}__`;
});

// Protect all HTML tags
processed = processed.replace(/<[^>]+>/g, (match) => {
  placeholders.push(match);
  return `__MATH_PLACEHOLDER_${placeholders.length - 1}__`;
});

const abbr = ['VD', 'TP', 'TS', 'ThS', 'GS', 'PGS', 'Mr', 'Ms', 'Dr'];
const abbrRegex = new RegExp(`(?<!\\b(?:${abbr.join('|')}))([.;])\\s*(?!\\d)`, 'g');

processed = processed.replace(abbrRegex, '$1<br>');

placeholders.forEach((placeholder, i) => {
  processed = processed.replace(`__MATH_PLACEHOLDER_${i}__`, placeholder);
});

console.log(processed);
