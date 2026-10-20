import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContentQuestion from './ContentQuestion';

describe('ContentQuestion Component', () => {
  it('renders essay answer with KaTeX when isEssay is true and correctAnswer is provided', () => {
    const { container } = render(
      <ContentQuestion
        content="Tìm nghiệm của phương trình $x^2 - 4 = 0$"
        isEssay={true}
        correctAnswer="x = \pm 2"
      />
    );

    expect(screen.getByText('Đáp án tự luận:')).toBeInTheDocument();
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

  it('renders sub-questions for group questions with essay answers', () => {
    render(
      <ContentQuestion
        sharedContext="Cho biểu thức $P(x)$"
        subQuestions={[
          {
            content: "Tính giá trị của $P(1)$",
            isEssay: true,
            correctAnswer: "$P(1) = 5$"
          }
        ]}
      />
    );

    expect(screen.getByText('Nội dung dẫn chung')).toBeInTheDocument();
    expect(screen.getByText('Đáp án tự luận:')).toBeInTheDocument();
  });
});
