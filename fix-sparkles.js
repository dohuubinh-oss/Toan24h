const fs = require('fs');
const file = 'frontend/src/app/(fullscreen)/exam/[id]/result/page.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('Sparkles')) {
  // Wait, the file HAS Sparkles in the JSX, but it's not imported!
}

code = code.replace(
  "import { CheckCircle, XCircle, ArrowLeft, ArrowRight, User } from 'lucide-react'",
  "import { CheckCircle, XCircle, ArrowLeft, ArrowRight, User, Sparkles } from 'lucide-react'"
);

fs.writeFileSync(file, code);
