'use client'

import { useState } from 'react'
import { countWords } from '../../engine/scoring'
import type { WritingItem } from '../../types'

export function WritingInput({ item, onChange }: { item: WritingItem; onChange: (text: string) => void }) {
  const [text, setText] = useState('')
  const wordCount = countWords(text)
  const withinRange = wordCount >= item.minWords && wordCount <= item.maxWords

  return (
    <div className="space-y-3">
      <p className="font-medium text-gray-900">{item.prompt}</p>
      {item.sourceText && (
        <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{item.sourceText}</p>
      )}
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          onChange(event.target.value)
        }}
        rows={item.taskType === 'writing-essay' ? 14 : 6}
        placeholder="在此输入你的回答……"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed focus:border-primary focus:outline-none"
      />
      <p className={`text-sm ${withinRange ? 'text-green-600' : 'text-amber-600'}`}>
        字数：{wordCount}（要求 {item.minWords}-{item.maxWords} 词）
      </p>
    </div>
  )
}
