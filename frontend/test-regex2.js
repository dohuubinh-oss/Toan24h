const html = `<p><strong>Bước 2: Phân tích các phương án</strong><br/>Biểu thức $2 + x^2y$ và $-\\frac{3}{4}x^3y + 7x$ chứa phép cộng nên là đa thức. Biểu thức $\\frac{x + y^3}{3y}$ chứa biến ở mẫu thức nên không phải đơn thức. Biểu thức $-\\frac{1}{5}x^4y^5$ là tích của số và các biến.</p>`;
let processed = html;
processed = processed.replace(/\$([^$]+?)\$/g, (match, p1) => {
  const escaped = p1.replace(/"/g, '&quot;');
  return `<math-inline data-latex="${escaped}">${match}</math-inline>`;
});
console.log(processed);
