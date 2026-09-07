const fs = require('fs');
const file = 'backend/internal/handlers/exam_result_handler.go';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  'isVip = user.Role == "vip"',
  'isVip = user.Role == "vip" || user.Role == "admin"'
);
fs.writeFileSync(file, code);
