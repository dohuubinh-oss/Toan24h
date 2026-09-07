const fs = require('fs');
const file = 'frontend/src/components/auth/LoginForm.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `      if (res.user?.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/lectures')
      }`,
  `      if (res.user?.role === 'admin') {
        window.location.href = '/dashboard/lectures'
      } else {
        window.location.href = '/lectures'
      }`
);

// Telegram login also has it:
code = code.replace(
  `      if (res.user?.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/lectures')
      }`,
  `      if (res.user?.role === 'admin') {
        window.location.href = '/dashboard/lectures'
      } else {
        window.location.href = '/lectures'
      }`
);

fs.writeFileSync(file, code);
