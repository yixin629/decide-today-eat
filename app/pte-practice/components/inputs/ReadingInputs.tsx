'use client'

import { useState } from 'react'
import type { FillBlanksDragItem, McqSingleItem, ReorderItem } from '../../types'

export function McqSingleInput({
  item,
  onChange,
}: {
  item: McqSingleItem
  onChange: (selectedIndex: number | null) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{item.passage}</p>
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
              name="mcq-single"
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

export function ReorderInput({
  item,
  onChange,
}: {
  item: ReorderItem
  onChange: (order: number[]) => void
}) {
  const [order, setOrder] = useState<number[]>(() => item.paragraphs.map((_, index) => index))

  function move(position: number, direction: -1 | 1) {
    const target = position + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[position], next[target]] = [next[target], next[position]]
    setOrder(next)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">用上下按钮调整段落顺序，使其符合逻辑（本练习用按钮排序代替原生拖拽，便于触屏和键盘操作）。</p>
      <ol className="space-y-2">
        {order.map((paragraphIndex, position) => (
          <li key={paragraphIndex} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(position, -1)}
                disabled={position === 0}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs disabled:opacity-30"
                aria-label="上移"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(position, 1)}
                disabled={position === order.length - 1}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs disabled:opacity-30"
                aria-label="下移"
              >
                ↓
              </button>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-gray-700">{item.paragraphs[paragraphIndex]}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function FillBlanksDragInput({
  item,
  onChange,
}: {
  item: FillBlanksDragItem
  onChange: (answers: string[]) => void
}) {
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array.from({ length: item.blankCount }, () => null))
  const [activeBlank, setActiveBlank] = useState(0)

  const usedWords = new Set(answers.filter((word): word is string => word !== null))

  function pickWord(word: string) {
    const nextAnswers = [...answers]
    const emptyIndex = nextAnswers.findIndex((value) => value === null)
    const targetIndex = emptyIndex === -1 ? activeBlank : emptyIndex
    nextAnswers[targetIndex] = word
    setAnswers(nextAnswers)
    onChange(nextAnswers.map((value) => value ?? ''))
    setActiveBlank(Math.min(targetIndex + 1, item.blankCount - 1))
  }

  function clearBlank(index: number) {
    const nextAnswers = [...answers]
    nextAnswers[index] = null
    setAnswers(nextAnswers)
    onChange(nextAnswers.map((value) => value ?? ''))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">点击下方词库中的单词，会依次填入文章的空格；点击已填空格可以清空重选（本练习用点选代替原生拖拽词条）。</p>
      <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {item.textSegments.map((segment, index) => (
          <span key={index}>
            {segment}
            {index < item.blankCount && (
              <button
                type="button"
                onClick={() => {
                  setActiveBlank(index)
                  if (answers[index]) clearBlank(index)
                }}
                className={`mx-1 inline-block min-w-16 rounded border-b-2 px-2 py-0.5 text-center font-medium ${
                  activeBlank === index ? 'border-primary bg-primary/10' : 'border-gray-400 bg-white'
                }`}
              >
                {answers[index] ?? '　　'}
              </button>
            )}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-2">
        {item.wordBank.map((word) => (
          <button
            key={word}
            type="button"
            disabled={usedWords.has(word)}
            onClick={() => pickWord(word)}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  )
}
