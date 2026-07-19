const katex = require('katex');
try {
  console.log(katex.renderToString("-\\frac{3}{4}x^3y + 7x", { throwOnError: false }));
} catch (e) {
  console.error("Error", e);
}
