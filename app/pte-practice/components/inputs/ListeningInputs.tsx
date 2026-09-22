'use client'

import { useState } from 'react'
import type { HighlightSummaryItem, ListeningFillBlanksItem } from '../../types'
import AudioOrTranscript from './AudioOrTranscript'

export function ListeningFillBlanksInput({
  item,
  onChange,
}: {
  item: ListeningFillBlanksItem
  onChange: (answers: string[]) => void
}) {
  const [answers, setAnswers] = useState<string[]>(() => Array.from({ length: item.correctAnswers.length }, () => ''))

  function updateAnswer(index: number, value: string) {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.transcript} />
      <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {item.textSegments.map((segment, index) => (
          <span key={index}>
            {segment}
            {index < answers.length && (
              <input
                value={answers[index]}
                onChange={(event) => updateAnswer(index, event.target.value)}
                className="mx-1 inline-block w-28 rounded border border-gray-300 px-2 py-0.5 text-center"
                aria-label={`空格 ${index + 1}`}
              />
            )}
          </span>
        ))}
      </p>
    </div>
  )
}

export function HighlightSummaryInput({
  item,
  onChange,
}: {
  item: HighlightSummaryItem
  onChange: (selectedIndex: number | null) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.transcript} />
      <p className="font-medium text-gray-900">{item.question}</p>
      <div className="space-y-2">
        {item.options.map((option, index) => (
          <label
            key={index}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
              selected === index ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="highlight-summary"
              className="mt-0.5"
              checked={selected === index}
              onChange={() => {
                setSelected(index)
                onChange(index)
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
