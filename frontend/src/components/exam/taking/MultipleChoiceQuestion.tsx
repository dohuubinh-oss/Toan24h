import React from 'react'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { RadioOption } from '../../ui/RadioOption'
export interface MultipleChoiceOption {
  id: string
  text: string
}

interface MultipleChoiceQuestionProps {
  questionId: number
  content: string
  options: MultipleChoiceOption[]
  selectedOptionId: string | null
  isFlagged: boolean
  onSelectOption: (optionId: string) => void
  onToggleFlag: () => void
}

export default function MultipleChoiceQuestion({
  questionId,
  content,
  options,
  selectedOptionId,
  isFlagged,
  onSelectOption,
  onToggleFlag,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 mt-10">
      <Card className="mb-8">
        <CardHeader className="flex flex-col gap-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <Badge variant="info" size="lg" className="gap-2">
              <Icon name="HelpCircle" size={16} />
              Câu {questionId}
            </Badge>
            <Button
              onClick={onToggleFlag}
              variant={isFlagged ? "danger" : "warning"}
              className="gap-2"
              size="sm"
            >
              <Icon name={isFlagged ? 'Flag' : 'FlagOff'} size={16} />
              <span>{isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}</span>
            </Button>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed font-medium">
            <p>{content}</p>
          </div>
        </CardHeader>

        <CardFooter className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {options.map((option) => (
              <RadioOption
                key={option.id}
                name={`q${questionId}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onSelectOption(option.id)}
                prefixContent={option.id}
                label={option.text}
              />
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
