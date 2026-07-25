import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY trong file .env.local' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file ảnh' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prepare generative AI model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `Bạn là một chuyên gia nhận dạng chữ viết tay và toán học.
Hãy nhận dạng văn bản và công thức toán học trong bức ảnh này.
Yêu cầu:
1. Trả về đúng nội dung trong ảnh.
2. Các công thức toán học phải được viết bằng cú pháp LaTeX chuẩn. Ví dụ phân số là \\frac{a}{b}, căn bậc hai là \\sqrt{a}, số mũ là x^2. Đặt công thức toán học trong cặp dấu $...$ nếu là trong dòng, hoặc $$...$$ nếu là đoạn riêng.
3. CHỈ trả về nội dung nhận dạng được, tuyệt đối KHÔNG thêm bất kỳ văn bản giải thích, chào hỏi hay bình luận nào khác. Nếu không nhận dạng được gì, hãy trả về chuỗi rỗng.`;

    const imageParts = [
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini OCR API:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi trong quá trình nhận dạng ảnh' },
      { status: 500 }
    );
  }
}
