import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContentQuestion from './ContentQuestion';

describe('ContentQuestion Component', () => {
  it('renders sharedContext when provided', () => {
    render(
      <ContentQuestion
        sharedContext="Cho biểu thức $P(x) = x^2 - 1$"
        content="Tính giá trị $P(2)$"
        isEssay={true}
      />
    );

    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument();
  });

  it('renders component dẫn chung when shared_content prop is provided', () => {
    render(
      <ContentQuestion
        shared_content="Đoạn văn bản dẫn chung cho bài toán"
        content="Câu hỏi số 1"
        isEssay={true}
      />
    );

    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument();
    expect(screen.getByText('Đoạn văn bản dẫn chung cho bài toán')).toBeInTheDocument();
  });

  it('renders solution guide and does not render separate essay answer badge', () => {
    const { container } = render(
      <ContentQuestion
        content="Tìm nghiệm của phương trình $x^2 - 4 = 0$"
        isEssay={true}
        correctAnswer="$x = \pm 2$"
        solution="Giải phương trình ta được $x = \pm 2$"
      />
    );

    expect(screen.queryByText('Đáp án tự luận:')).not.toBeInTheDocument();
    expect(screen.getByText('HƯỚNG DẪN CHẤM / LỜI GIẢI MẪU:')).toBeInTheDocument();
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders multiple choice options when isEssay is false', () => {
    render(
      <ContentQuestion
        content="Phương trình $x - 1 = 0$ có nghiệm là:"
        isEssay={false}
        options={['$x = 1$', '$x = 2$', '$x = 3$', '$x = 4$']}
        correctAnswer="$x = 1$"
      />
    );

    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
  });

  it('renders sub-questions for group questions with solution guide', () => {
    render(
      <ContentQuestion
        sharedContext="Cho biểu thức $P(x)$"
        subQuestions={[
          {
            content: "Tính giá trị của $P(1)$",
            isEssay: true,
            correctAnswer: "$P(1) = 5$",
            solution: "Thay $x = 1$ vào $P(x)$ ta được $P(1) = 5$"
          }
        ]}
      />
    );

    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument();
    expect(screen.queryByText('Đáp án tự luận:')).not.toBeInTheDocument();
    expect(screen.getByText('HƯỚNG DẪN CHẤM / LỜI GIẢI MẪU:')).toBeInTheDocument();
  });

  it('renders illustration diagram at the top for single questions', () => {
    const mockSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';
    const { container } = render(
      <ContentQuestion
        type_question="single"
        diagram_svg={mockSvg}
        content="Cho hình tròn tâm O như hình vẽ"
        isEssay={false}
        options={['A', 'B']}
      />
    );

    const illustration = screen.getByTestId('question-illustration');
    expect(illustration).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();

    // Verify illustration is placed before the question content in the DOM hierarchy
    const contentText = screen.getByText('Cho hình tròn tâm O như hình vẽ');
    expect(illustration.compareDocumentPosition(contentText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders illustration diagram below shared context for group questions', () => {
    const mockSvg = '<svg viewBox="0 0 200 200"><polygon points="10,10 50,50 10,50" /></svg>';
    render(
      <ContentQuestion
        type_question="group"
        sharedContext="Cho tam giác ABC với các đường cao như hình vẽ"
        diagram_svg={mockSvg}
        subQuestions={[
          {
            content: "Chứng minh tam giác đồng dạng",
            isEssay: true,
            correctAnswer: "ĐPCM"
          }
        ]}
      />
    );

    const sharedContextEl = screen.getByText('Nội dung dẫn chung');
    const illustration = screen.getByTestId('question-illustration');
    const subQuestionEl = screen.getByText('Chứng minh tam giác đồng dạng');

    expect(sharedContextEl).toBeInTheDocument();
    expect(illustration).toBeInTheDocument();
    expect(subQuestionEl).toBeInTheDocument();

    // Verify illustration comes AFTER shared context and BEFORE sub-questions
    expect(sharedContextEl.compareDocumentPosition(illustration) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(illustration.compareDocumentPosition(subQuestionEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does NOT render illustration when diagram_svg is null, empty string, "null", or non-image text', () => {
    const { rerender } = render(
      <ContentQuestion
        type_question="single"
        diagram_svg={null}
        content="Câu hỏi không có hình"
        isEssay={true}
      />
    );
    expect(screen.queryByTestId('question-illustration')).toBeNull();

    rerender(
      <ContentQuestion
        type_question="single"
        diagram_svg=""
        content="Câu hỏi không có hình"
        isEssay={true}
      />
    );
    expect(screen.queryByTestId('question-illustration')).toBeNull();

    rerender(
      <ContentQuestion
        type_question="single"
        diagram_svg="null"
        content="Câu hỏi không có hình"
        isEssay={true}
      />
    );
    expect(screen.queryByTestId('question-illustration')).toBeNull();

    rerender(
      <ContentQuestion
        type_question="single"
        diagram_svg='<div class="exercise-content">Lời giải chi tiết mà không có hình</div>'
        content="Câu hỏi có HTML nhưng không có hình"
        isEssay={true}
      />
    );
    expect(screen.queryByTestId('question-illustration')).toBeNull();
  });

  it('renders ONLY ONE illustration for group question, not inside sub-questions', () => {
    const mockSvg = '<svg viewBox="0 0 200 200"><polygon points="10,10 50,50 10,50" /></svg>';
    render(
      <ContentQuestion
        type_question="group"
        sharedContext="Cho hình vuông ABCD. Lấy E sao cho D là trung điểm của AE."
        diagram_svg={mockSvg}
        subQuestions={[
          {
            content: "Chứng minh: BM = CN",
            isEssay: true,
            correctAnswer: "ĐPCM"
          },
          {
            content: "Chứng minh BMNC là hình bình hành",
            isEssay: true,
            correctAnswer: "ĐPCM"
          }
        ]}
      />
    );

    const illustrations = screen.getAllByTestId('question-illustration');
    expect(illustrations).toHaveLength(1);
  });
});
