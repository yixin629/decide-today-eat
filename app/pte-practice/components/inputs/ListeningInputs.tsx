'use client'

import { useState } from 'react'
import { countWords } from '../../engine/scoring'
import type {
  HighlightIncorrectWordsItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  ListeningMcqMultipleItem,
  ListeningMcqSingleItem,
  ListeningSummarizeItem,
  SelectMissingWordItem,
  WriteFromDictationItem,
} from '../../types'
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

export function ListeningMcqSingleInput({
  item,
  onChange,
}: {
  item: ListeningMcqSingleItem
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
              name="listening-mcq-single"
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

export function ListeningMcqMultipleInput({
  item,
  onChange,
}: {
  item: ListeningMcqMultipleItem
  onChange: (selectedIndexes: number[]) => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  function toggle(index: number) {
    const next = selected.includes(index) ? selected.filter((value) => value !== index) : [...selected, index]
    setSelected(next)
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.transcript} />
      <p className="font-medium text-gray-900">{item.question}</p>
      <p className="text-xs text-gray-400">可多选：正确答案数量不会提前告知。</p>
      <div className="space-y-2">
        {item.options.map((option, index) => (
          <label
            key={index}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
              selected.includes(index) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input type="checkbox" className="mt-0.5" checked={selected.includes(index)} onChange={() => toggle(index)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function ListeningSummarizeInput({ item, onChange }: { item: ListeningSummarizeItem; onChange: (text: string) => void }) {
  const [text, setText] = useState('')
  const wordCount = countWords(text)
  const withinRange = wordCount >= item.minWords && wordCount <= item.maxWords
  return (
    <div className="space-y-3">
      <AudioOrTranscript text={item.transcript} />
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          onChange(event.target.value)
        }}
        rows={6}
        placeholder="用 50-70 词写一段总结……"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed focus:border-primary focus:outline-none"
      />
      <p className={`text-sm ${withinRange ? 'text-green-600' : 'text-amber-600'}`}>
        字数：{wordCount}（要求 {item.minWords}-{item.maxWords} 词）
      </p>
    </div>
  )
}

export function SelectMissingWordInput({
  item,
  onChange,
}: {
  item: SelectMissingWordItem
  onChange: (selectedIndex: number | null) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.fullTranscript} revealText={item.displayedTranscript} />
      <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{item.displayedTranscript}</p>
      <p className="text-xs text-gray-400">选出能补全录音结尾空缺部分的选项。</p>
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
              name="select-missing-word"
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

export function HighlightIncorrectWordsInput({
  item,
  onChange,
}: {
  item: HighlightIncorrectWordsItem
  onChange: (selectedWordIndexes: number[]) => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  function toggle(index: number) {
    const next = selected.includes(index) ? selected.filter((value) => value !== index) : [...selected, index]
    setSelected(next)
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.audioTranscript} />
      <p className="text-xs text-gray-400">点击下方文字稿中与实际朗读内容不符的单词（可多选，点击已选中的词可取消）。</p>
      <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {item.displayedWords.map((word, index) => (
          <button
            key={index}
            type="button"
            onClick={() => toggle(index)}
            className={`mx-0.5 rounded px-1 ${selected.includes(index) ? 'bg-amber-200 text-amber-900' : 'hover:bg-gray-200'}`}
          >
            {word}
          </button>
        ))}
      </p>
    </div>
  )
}

export function WriteFromDictationInput({ item, onChange }: { item: WriteFromDictationItem; onChange: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="space-y-3">
      <AudioOrTranscript text={item.sentence} />
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          onChange(event.target.value)
        }}
        rows={3}
        placeholder="输入你听到的完整句子……"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed focus:border-primary focus:outline-none"
      />
    </div>
  )
}
