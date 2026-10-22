import React from 'react'
import { QuestionBlock, Question } from '../../../types/question'
import JsonInputCard from '@/components/common/JsonInputCard'
import {
  formatTextToHtml,
  formatQuestionContent,
  formatSolutionGuide,
  ensureMathDelimiters
} from './utils/questionTextFormatter'

interface JsonInputSectionProps {
  onProcessJson?: (blocks: QuestionBlock[]) => void;
  onAiExtract?: () => void;
  currentGlobalIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Question | null;
  onNext?: () => void;
  onPrev?: () => void;
  initialValue?: string;
}

export const QUESTION_JSON_HINT = `[
  {
    "shared_content": null, // Chuỗi nội dung dẫn chung (nếu là câu hỏi chùm) hoặc null (nếu là câu hỏi đơn lẻ)
    "type_question": "single", // string ('group' cho câu hỏi chùm | 'single' cho câu hỏi đơn)
    "questions": [
      {
        "content": "Nội dung câu hỏi bằng LaTeX (Không bao gồm phương án lựa chọn A, B, C, D)",
        "type": "Trắc nghiệm", // string (Chỉ chọn một trong hai: 'Trắc nghiệm' hoặc 'Tự luận')
        "grade": 9, // int (Chỉ chọn một trong các số: 5, 6, 7, 8, 9)
        "topic": "Định lý Viète và ứng dụng", // string (Tùy theo khối lớp và nội dung câu hỏi, chọn 1 và chỉ 1 chủ đề tương ứng lớp và phù hợp nhất trong topic.txt)
        "difficulty_level": "Thông hiểu", // string (Chỉ chọn một trong: 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao')
        "difficulty_point": 5.0, // float (Từ 0.0 đến 10.0)
        "point": 1, // int, nếu không gửi kèm bảng điểm thì mỗi câu đơn 1 điểm, câu hỏi chùm bằng số câu con
        "tags": ["Phương trình bậc hai", "Định lý Viète"], // mảng các từ_khóa
        "options": [
          "$x = 2; x = 3$",
          "$x = 1; x = 6$",
          "$x = -2; x = -3$",
          "Vô nghiệm"
        ], // Mảng các phương án lựa chọn bằng LaTeX (CHỈ LẤY NỘI DUNG, loại bỏ hoàn toàn tiền tố nhãn A., B., C., D.), để trống [] nếu là tự luận
        "correct_answer": "$x = 2; x = 3$", // Đáp án đúng bằng LaTeX
        "solution_guide": {
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Viète",
              "content": "Tính tổng và tích các nghiệm của phương trình:",
              "formula": "$S = x_1 + x_2 = 5, \\\\quad P = x_1 x_2 = 6$"
            },
            {
              "step": 2,
              "title": "Tìm nghiệm",
              "content": "Các nghiệm của phương trình là:",
              "formula": "$x_1 = 2, \\\\quad x_2 = 3$"
            }
          ],
          "conclusion": "Vậy phương trình có hai nghiệm là $x = 2$ và $x = 3$."
        },
        "hint": "Chỉ dẫn nhỏ, gợi nhớ công thức hoặc hướng tiếp cận bài toán",
        "short_answer": "Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết cách giải",
        "general_method": "Công thức tổng quát hóa cho dạng bài toán này",
        "mistakes": "Các lỗi sai học sinh thường vấp phải"
      }
    ]
  }
]`;

export const QUESTION_AI_PROMPT_TEMPLATE = `Bạn là chuyên gia biên tập và số hóa đề thi Toán học Việt Nam.
Hãy đọc đề thi và bóc tách TOÀN BỘ các câu hỏi thành định dạng JSON chuẩn theo CẤU TRÚC ĐẦU RA JSON MẪU (OUTPUT SCHEMA) sau:

[
  {
    "shared_content": "Chuỗi nội dung dẫn chung (nếu là câu hỏi chùm) hoặc null (nếu là câu hỏi đơn lẻ)",
    "type_question": "string ('group' cho câu hỏi chùm | 'single' cho câu hỏi đơn)",
    "questions": [
      {
        "content": "Nội dung câu hỏi bằng LaTeX: Cho phương trình $x^2 - 5x + 6 = 0$...",
        "type": "string (Chỉ chọn một trong hai: 'Trắc nghiệm' hoặc 'Tự luận')",
        "grade": "int (Chỉ chọn một trong các số: 5, 6, 7, 8, 9)",
        "topic": "string (Tùy theo khối lớp và nội dung câu hỏi, chọn 1 và chỉ 1 chủ đề tương ứng lớp và phù hợp nhất trong topic.txt)",
        "difficulty_level": "string (Chỉ chọn một trong: 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao')",
        "difficulty_point": "float (Từ 0.0 đến 10.0)",
        "point": "int, nếu không gửi kèm bảng điểm thì mỗi câu đơn 1 điểm, câu hỏi chùm bằng số câu con",
        "tags": ["mảng", "các", "từ_khóa"],
        "options": ["$x = 2; x = 3$", "$x = 1; x = 6$", "$x = -2; x = -3$", "Vô nghiệm"],
        "correct_answer": "$x = 2; x = 3$",
        "solution_guide": {
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Viète",
              "content": "Tính tổng và tích các nghiệm của phương trình:",
              "formula": "$S = x_1 + x_2 = 5, \\\\quad P = x_1 x_2 = 6$"
            },
            {
              "step": 2,
              "title": "Tìm nghiệm",
              "content": "Các nghiệm của phương trình là:",
              "formula": "$x_1 = 2, \\\\quad x_2 = 3$"
            }
          ],
          "conclusion": "Vậy phương trình có hai nghiệm là $x = 2$ và $x = 3$."
        },
        "hint": "Chỉ dẫn nhỏ, gợi nhớ công thức hoặc hướng tiếp cận bài toán",
        "short_answer": "Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết cách giải",
        "general_method": "Công thức tổng quát hóa cho dạng bài toán này",
        "mistakes": "Các lỗi sai học sinh thường vấp phải"
      }
    ]
  },
  {
    "shared_content": "Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $AB = 6\\\\text{ cm}$, $AC = 8\\\\text{ cm}$.",
    "type_question": "group",
    "questions": [
      {
        "content": "Tính độ dài cạnh huyền $BC$.",
        "type": "Tự luận",
        "grade": 9,
        "topic": "Hệ thức giữa cạnh và góc",
        "difficulty_level": "Nhận biết",
        "difficulty_point": 2.5,
        "point": 1,
        "tags": ["Hệ thức lượng", "Tam giác vuông"],
        "options": [],
        "correct_answer": "$BC = 10\\\\text{ cm}$",
        "solution_guide": {
          "steps": [
            {
              "step": 1,
              "title": "Áp dụng định lý Pythagoras",
              "content": "Áp dụng định lý Pythagoras vào tam giác $ABC$ vuông tại $A$:",
              "formula": "$BC^2 = AB^2 + AC^2 = 6^2 + 8^2 = 100 \\\\implies BC = 10\\\\text{ cm}$"
            }
          ],
          "conclusion": "Vậy $BC = 10\\\\text{ cm}$."
        },
        "hint": "Sử dụng định lý Pythagoras trong tam giác vuông",
        "short_answer": "$BC = \\\\sqrt{6^2 + 8^2} = 10\\\\text{ cm}$",
        "general_method": "Áp dụng định lý Pythagoras $BC = \\\\sqrt{AB^2 + AC^2}$",
        "mistakes": "Quên khai căn bậc hai sau khi cộng bình phương"
      }
    ]
  }
]

HỆ THỐNG CHỦ ĐỀ CHUẨN THEO TỪNG KHỐI LỚP (BẮT BUỘC CHỌN 1 VÀ CHỈ 1 CHỦ ĐỀ PHÙ HỢP NHẤT):
- Lớp 9: Phương trình bậc nhất hai ẩn, Hệ hai phương trình bậc nhất hai ẩn, Hàm số y = ax^2 (a khác 0), Đồ thị hàm số bậc hai đơn giản, Công thức nghiệm phương trình bậc hai, Định lý Viète và ứng dụng, Tỉ số lượng giác của góc nhọn, Hệ thức giữa cạnh và góc, Sự xác định đường tròn và vị trí tương đối, Góc với đường tròn (Góc nội tiếp, góc ở tâm), Hình trụ, Hình nón, Hình cầu
- Lớp 8: Đơn thức và đa thức nhiều biến, Các phép tính với đa thức, Hằng đẳng thức đáng nhớ, Khái niệm phân thức, Các phép toán cộng, trừ, nhân, chia phân thức, Khái niệm hàm số, Hàm số bậc nhất y = ax + b, Hệ số góc của đường thẳng, Cách giải phương trình bậc nhất một ẩn, Giải bài toán bằng cách lập phương trình, Định lý Thalès thuận và đảo, Đường trung bình của tam giác, Các trường hợp đồng dạng của tam giác, Tam giác vuông đồng dạng, Hình chóp tam giác đều, Hình chóp tứ giác đều
- Lớp 7: Tập hợp số hữu tỉ, Căn bậc hai số học và số thực, Tỉ lệ thức và tính chất dãy tỉ số bằng nhau, Đại lượng tỉ lệ thuận, tỉ lệ nghịch, Biểu thức đại số, Đa thức một biến và nghiệm của đa thức, Hai góc kề bù, đối đỉnh, Dấu hiệu hai đường thẳng song song, Tổng các góc trong một tam giác, Tam giác bằng nhau (c.c.c, c.g.c, g.c.g), Tam giác cân và định lý Pythagoras, Làm quen với xác suất của biến cố ngẫu nhiên
- Lớp 6: Tập hợp số tự nhiên, Tính chất chia hết và ước số, Tập hợp số nguyên và phép tính, Phân số bằng nhau và rút gọn, Các phép tính với số thập phân, Hình vuông, tam giác đều, lục giác đều, Hình chữ nhật, hình thoi, hình bình hành, Hình có trục đối xứng, Hình có tâm đối xứng, Điểm, đường thẳng, đoạn thẳng, Trung điểm của đoạn thẳng, Góc và số đo góc
- Lớp 5: Phân số thập phân và hỗn số, Số thập phân và các phép toán, Diện tích hình tam giác, hình thang, Chu vi và diện tích hình tròn, Hình hộp chữ nhật, hình lập phương, Hình trụ, hình cầu, Đo thể tích và chuyển đổi đơn vị, Toán chuyển động đều, Giải toán tỉ số phần trăm

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ TRƯỜNG HỢP NGOẠI LỆ):
1. BỎ HOÀN TOÀN TRƯỜNG "is_group": Mỗi block CHỈ gồm đúng 3 trường: "shared_content", "type_question", "questions".
2. CÔNG THỨC TOÁN HỌC: BẮT BUỘC 100% tất cả các công thức toán học, biểu thức, phương trình, nghiệm, đáp số trong "content", "options", "correct_answer", "formula", "conclusion" ĐỀU PHẢI ĐƯỢC BỌC TRONG CẶP DẤU $...$ (hoặc $$...$$). Tuyệt đối KHÔNG viết trần trụi "x = 2; x = 3" mà PHẢI viết "$x = 2; x = 3$". KÝ HIỆU GÓC HÌNH HỌC: BẮT BUỘC dùng dấu mũ trên đỉnh chữ cái theo cú pháp LaTeX chuẩn: dùng \\hat{A}, \\hat{B}, \\hat{C} cho góc 1 chữ cái hoặc \\widehat{ABC}, \\widehat{xOy} cho góc 3 chữ cái (ví dụ: \\hat{A} = \\hat{C}, \\widehat{ABC} = 60^\\circ). TUYỆT ĐỐI KHÔNG dùng \\angle hoặc ký tự Unicode ∠.
3. "shared_content": Chuỗi nội dung dẫn chung nếu là câu hỏi chùm hoặc null nếu là câu hỏi đơn lẻ.
4. "type_question": 'group' cho câu hỏi chùm | 'single' cho câu hỏi đơn.
   - QUY TẮC BẮT BUỘC PHÂN BIỆT CÂU ĐƠN VÀ CÂU CHÙM:
     + CÂU HỎI ĐƠN ('single'): Áp dụng cho các câu hỏi độc lập (như Câu 1, Câu 2, ..., Câu 15 trắc nghiệm trong đề thi).
       * BẮT BUỘC mỗi câu hỏi đơn phải là MỘT block riêng biệt trong mảng JSON: {"shared_content": null, "type_question": "single", "questions": [ { ... } ]}.
       * TUYỆT ĐỐI KHÔNG GOM NHIỀU CÂU HỎI ĐƠN VÀO CÙNG MỘT BLOCK! Nếu đề có 15 câu trắc nghiệm độc lập thì đầu ra JSON BẮT BUỘC là một mảng gồm 15 block riêng biệt.
       * Các tiêu đề phân phần của đề thi (như "I. PHẦN TRẮC NGHIỆM", "II. TỰ LUẬN", "Phần 1: 5.0 điểm") KHÔNG PHẢI là câu hỏi chùm, TUYỆT ĐỐI KHÔNG dùng tiêu đề phần để tạo block 'group'.
     + CÂU HỎI CHÙM ('group'): CHỈ ĐƯỢC DÙNG khi các câu hỏi con CÙNG DÙNG CHUNG một đoạn văn bản ngữ cảnh, bảng biểu hoặc bài toán gốc được đặt trong "shared_content" (ví dụ: "Cho tam giác ABC... Hãy trả lời các câu sau: a) ..., b) ..."). Khi đó "shared_content" KHÔNG ĐƯỢC để null. Nếu không có nội dung dùng chung ("shared_content": null), TUYỆT ĐỐI KHÔNG được để "type_question": "group".
5. "content": Nội dung câu hỏi sạch sẽ, bỏ tiền tố số thứ tự (ví dụ: 'Câu 1.', 'Bài 2:').
6. "options": Mảng phương án LaTeX (CHỈ LẤY NỘI DUNG, loại bỏ hoàn toàn tiền tố nhãn A., B., C., D.), để trống [] nếu là tự luận.
7. "correct_answer": Bắt buộc luôn có đáp án đúng bằng LaTeX bọc trong $...$ (tự giải nếu đề bài chưa có đáp án).
8. "solution_guide": Object gồm mảng "steps" (step, title, content dùng ký hiệu • để gạch đầu dòng, formula bọc trong $...$) và "conclusion".
9. "short_answer": Lời giải ngắn gọn, cô đọng nhất giúp học sinh nhìn vào là biết ngay cách giải bài toán. Nếu đề bài/tài liệu gốc có sẵn đáp án mẫu hoặc lời giải vắn tắt thì trích xuất vào; nếu không có thì AI bắt buộc phải tự giải và sinh ra lời giải ngắn gọn, súc tích nhất.
10. CHỈ trả về DUY NHẤT chuỗi JSON hợp lệ, tuyệt đối không kèm văn bản giải thích.`;

export default function JsonInputSection({
  onProcessJson = () => {},
  onAiExtract,
  initialValue = ''
}: JsonInputSectionProps) {
  const handleProcess = (jsonInput: string) => {
    const parsed = JSON.parse(jsonInput) as QuestionBlock[];
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu phải là mảng (array)');
    }
    
    const processedBlocks = parsed.map(block => {
      const hasShared = block.shared_content !== null && block.shared_content !== undefined && block.shared_content.trim() !== '';
      const questionsList = block.questions || [];
      const isGroup = (block.is_group === true || 
        block.type_question?.toLowerCase() === 'group' ||
        block.questions?.some(q => q.type_question?.toString().toLowerCase() === 'group') ||
        hasShared) && questionsList.length > 1;

      const formattedShared = hasShared ? formatTextToHtml(block.shared_content) : null;
      const groupPoint = isGroup ? (block.point || questionsList.length || 1) : (block.point || 1);

      return {
        ...block,
        shared_content: formattedShared,
        type_question: (isGroup ? 'group' : 'single') as 'group' | 'single',
        is_group: isGroup,
        point: groupPoint,
        questions: questionsList.map(q => {
          const processedQ = { ...q };

          // Chuẩn hóa type_question
          processedQ.type_question = isGroup ? 'group' : 'single';

          // Chuẩn hóa type
          processedQ.type = processedQ.type === 'Trắc nghiệm' ? 'Trắc nghiệm' : 'Tự luận';

          // Chuẩn hóa điểm
          if (!processedQ.point || processedQ.point <= 0) {
            processedQ.point = 1;
          }

          // Đồng bộ 2 chiều giữa short_answer và quick_solve_tips
          if (!processedQ.short_answer && (processedQ as any).quick_solve_tips) {
            processedQ.short_answer = (processedQ as any).quick_solve_tips;
          } else if (!processedQ.quick_solve_tips && processedQ.short_answer) {
            processedQ.quick_solve_tips = processedQ.short_answer;
          }

          // Chuẩn hóa và tự động xuống dòng/HTML cho nội dung câu hỏi
          if (processedQ.content) {
            processedQ.content = formatQuestionContent(processedQ.content);
          }

          // Chuẩn hóa và tự động xuống dòng/HTML cho lời giải chi tiết
          if (processedQ.solution_guide) {
            processedQ.solution_guide = formatSolutionGuide(processedQ.solution_guide);
          }

          // Làm sạch tiền tố A., B., C., D. và đảm bảo bọc công thức toán trong $...$
          if (processedQ.type === 'Tự luận') {
            processedQ.options = [];
          } else if (processedQ.options && Array.isArray(processedQ.options)) {
            processedQ.options = processedQ.options.map(opt => {
              const stripped = opt.replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, match =>
                match.startsWith('<p>') ? '<p>' : ''
              )
              return ensureMathDelimiters(stripped)
            });
          }

          if (processedQ.correct_answer) {
            let rawAns = processedQ.correct_answer.replace(/^(?:<p>\s*)?[A-Da-d][.)]\s*/i, match =>
              match.startsWith('<p>') ? '<p>' : ''
            )
            if (/^[A-Da-d]$/.test(rawAns.trim()) && processedQ.options && processedQ.options.length > 0) {
              const idx = rawAns.trim().toUpperCase().charCodeAt(0) - 65
              if (processedQ.options[idx]) {
                rawAns = processedQ.options[idx]
              }
            }
            processedQ.correct_answer = ensureMathDelimiters(rawAns)
          }

          return processedQ;
        })
      };
    });

    onProcessJson(processedBlocks);
  };

  return (
    <section className="space-y-4">
      <JsonInputCard
        title="Nhập nhanh bằng JSON"
        badge="Thông minh"
        placeholder={QUESTION_JSON_HINT}
        buttonText="Xử lý JSON"
        onProcess={handleProcess}
        onAiExtract={onAiExtract}
        copyPromptText={QUESTION_AI_PROMPT_TEMPLATE}
        initialValue={initialValue}
      />
    </section>
  )
}
