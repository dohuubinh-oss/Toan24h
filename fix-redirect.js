const fs = require('fs');
const file = 'frontend/src/app/(fullscreen)/exam/[id]/take/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the redirect logic
code = code.replace(
  `// Force full page reload on the previous URL to clear Next.js client router cache
        if (typeof window !== 'undefined' && document.referrer) {
          window.location.href = document.referrer;
        } else {
          router.back();
        }`,
  `// Navigate back to the appropriate page and force a hard reload
        const baseUrl = exam.cate === 'exam' ? '/exams/lop/' : '/practices/lop/';
        const backUrl = exam.grade ? (baseUrl + exam.grade) : '/student';
        window.location.href = backUrl;`
);

fs.writeFileSync(file, code);
