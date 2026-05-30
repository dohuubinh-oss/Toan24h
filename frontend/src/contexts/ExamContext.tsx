'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExamContextType {
  selectedQuestionIds: string[];
  setSelectedQuestionIds: (ids: string[]) => void;
  clearSelectedQuestions: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  return (
    <ExamContext.Provider value={{ selectedQuestionIds, setSelectedQuestionIds, clearSelectedQuestions }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}
