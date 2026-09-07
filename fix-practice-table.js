const fs = require('fs');
const file = 'frontend/src/components/practices/PracticeTable.tsx';
let code = fs.readFileSync(file, 'utf8');

// The TR onClick logic
code = code.replace(
  `                  onClick={() => {
                    if (isPending || isCompleted) {
                      router.push(\`/exam/\${practice.id}/result\`);
                    } else {
                      sessionStorage.removeItem(\`exam_state_\${practice.id}\`);
                      router.push(\`/exam/\${practice.id}/take\`);
                    }
                  }}`,
  `                  onClick={() => {
                    if (isPending || isCompleted) {
                      router.push(\`/exam/\${practice.id}/result\`);
                    } else {
                      sessionStorage.removeItem(\`exam_state_\${practice.id}\`);
                      router.push(\`/exam/\${practice.id}/take\`);
                    }
                  }}`
);

// The Button onClick logic
code = code.replace(
  `                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPending || isCompleted) {
                          router.push(\`/exam/\${practice.id}/result\`);
                        } else {
                          sessionStorage.removeItem(\`exam_state_\${practice.id}\`);
                          router.push(\`/exam/\${practice.id}/take\`);
                        }
                      }}`,
  `                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPending) {
                          router.push(\`/exam/\${practice.id}/result\`);
                        } else {
                          // Nếu Chưa làm hoặc Đã làm (Làm lại), đều chuyển sang trang làm bài
                          sessionStorage.removeItem(\`exam_state_\${practice.id}\`);
                          router.push(\`/exam/\${practice.id}/take\`);
                        }
                      }}`
);

fs.writeFileSync(file, code);
