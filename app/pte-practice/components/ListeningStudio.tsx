'use client'

import { ArrowRight, Headphones, Pause, Play, Repeat } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { itemKey, TASK_CODES } from '../lib/study'
import type { PracticeItem, TaskType } from '../types'

/**
 * "精听跟读"专用的文本提取：跟练习本体（PracticeSession/AudioOrTranscript）
 * 一样，遇到题目本身会剧透答案的题型（Select Missing Word 的结尾词、
 * Highlight Incorrect Words 的"正确说法"），展示文本和朗读文本要分开——
 * 展示给用户看的必须是"考生在真实考试里会看到的版本"，不能因为这是一个
 * 学习工具就提前把答案亮出来。
 */
function getListeningText(item: PracticeItem): { display: string; speech: string } | null {
  if (item.taskType === 'listening-select-missing-word') {
    return { display: item.displayedTranscript, speech: item.fullTranscript }
  }
  if (item.taskType === 'listening-highlight-incorrect-words') {
    const display = item.displayedWords.join(' ')
    return { display, speech: item.audioTranscript }
  }
  if (item.taskType === 'listening-write-from-dictation') {
    return { display: item.sentence, speech: item.sentence }
  }
  if ('transcript' in item && typeof item.transcript === 'string') {
    return { display: item.transcript, speech: item.transcript }
  }
  return null
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [text]
  return parts.map((part) => part.trim()).filter(Boolean)
}

const RATES = [0.75, 0.9, 1, 1.1, 1.25]

export default function ListeningStudio({ items, onPractice }: { items: PracticeItem[]; onPractice: (taskType: TaskType, itemId: string) => void }) {
  const listeningItems = useMemo(
    () => items.filter((item) => TASK_TYPE_META[item.taskType].skill === 'listening' && getListeningText(item) !== null),
    [items]
  )
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [rate, setRate] = useState(1)
  const [loop, setLoop] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [activeSentence, setActiveSentence] = useState(-1)
  const [supported, setSupported] = useState(false)

  const queueRef = useRef<string[]>([])
  const cursorRef = useRef(0)
  const loopRef = useRef(loop)

  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  // speechSynthesis 是浏览器全局资源，切歌/离开页面时必须主动 cancel，
  // 否则会像之前修过的那个 bug一样，朗读不会因为组件卸载而停止。
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (!listeningItems.length) return
    if (!selectedKey || !listeningItems.some((item) => itemKey(item) === selectedKey)) {
      setSelectedKey(itemKey(listeningItems[0]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeningItems])

  const selected = listeningItems.find((item) => itemKey(item) === selectedKey) ?? null
  const text = selected ? getListeningText(selected) : null
  const sentences = useMemo(() => (text ? splitSentences(text.speech) : []), [text])
  const displaySentences = useMemo(() => (text ? splitSentences(text.display) : []), [text])

  function stop() {
    window.speechSynthesis.cancel()
    setPlaying(false)
    setActiveSentence(-1)
  }

  function speakFrom(startIndex: number) {
    if (!supported || sentences.length === 0) return
    window.speechSynthesis.cancel()
    queueRef.current = sentences
    cursorRef.current = startIndex
    setPlaying(true)
    playNext()
  }

  function playNext() {
    const queue = queueRef.current
    const index = cursorRef.current
    if (index >= queue.length) {
      if (loopRef.current) {
        cursorRef.current = 0
        playNext()
        return
      }
      setPlaying(false)
      setActiveSentence(-1)
      return
    }
    setActiveSentence(index)
    const utterance = new SpeechSynthesisUtterance(queue[index])
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.onend = () => {
      cursorRef.current = index + 1
      playNext()
    }
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  function selectItem(key: string) {
    stop()
    setSelectedKey(key)
  }

  function playSentence(index: number) {
    speakFrom(index)
  }

  if (listeningItems.length === 0) {
    return (
      <div className="pte-empty">
        <Headphones size={30} />
        <h3>暂时没有可用的听力素材</h3>
        <p>题库加载完成后，这里会列出所有支持精听跟读的听力题型。</p>
      </div>
    )
  }

  return (
    <div className="pte-listen-grid">
      <div className="pte-playlist" role="listbox" aria-label="听力素材列表">
        {listeningItems.map((item) => {
          const key = itemKey(item)
          const meta = TASK_TYPE_META[item.taskType]
          return (
            <button key={key} role="option" aria-selected={key === selectedKey} className={key === selectedKey ? 'active' : ''} onClick={() => selectItem(key)}>
              <span className={`pte-task-code skill-listening`}>{TASK_CODES[item.taskType]}</span>
              <span>
                <strong>{meta.shortLabel}</strong>
                <br />#{item.id}
              </span>
            </button>
          )
        })}
      </div>

      <div>
        {!supported && (
          <div className="pte-notice" role="status">
            当前浏览器不支持语音合成朗读，已直接显示文字稿，可自行朗读跟读。
          </div>
        )}

        {selected && (
          <div className="pte-audio-player">
            <div className="pte-player-controls">
              <button type="button" className="pte-button primary" disabled={!supported} onClick={() => (playing ? stop() : speakFrom(0))}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? '暂停' : '从头播放'}
              </button>
              <label className="pte-select-label">
                语速
                <select aria-label="朗读语速" value={rate} onChange={(event) => setRate(Number(event.target.value))} disabled={!supported}>
                  {RATES.map((value) => (
                    <option key={value} value={value}>
                      {value}x
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={`pte-button ${loop ? 'primary' : ''}`}
                aria-pressed={loop}
                disabled={!supported}
                onClick={() => setLoop((value) => !value)}
              >
                <Repeat size={16} />
                循环播放
              </button>
              <button type="button" className="pte-button" onClick={() => onPractice(selected.taskType, selected.id)}>
                去练习
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="pte-player-status">
              {playing ? `正在朗读第 ${activeSentence + 1} / ${sentences.length} 句` : '点击下方任意一句可单独跟读该句'}
              {' · 本练习没有真实听力录音，使用浏览器语音合成朗读，非官方录音。'}
            </p>
            <div className="pte-transcript">
              {displaySentences.map((sentence, index) => (
                <button key={index} type="button" className={index === activeSentence ? 'active' : ''} onClick={() => playSentence(index)} disabled={!supported}>
                  {sentence}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
