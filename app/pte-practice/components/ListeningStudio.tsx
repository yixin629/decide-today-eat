'use client'

import { ArrowRight, Eye, EyeOff, Headphones, Pause, Play, Search, SkipBack, SkipForward, Square } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSpeechPlayer } from '../hooks/useSpeechPlayer'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { itemKey, TASK_CODES } from '../lib/study'
import type { PracticeItem, TaskType } from '../types'

function listeningText(item: PracticeItem): { display: string; speech: string } | null {
  if (item.taskType === 'listening-select-missing-word') return { display: item.displayedTranscript, speech: item.displayedTranscript.split('____')[0] }
  if (item.taskType === 'listening-highlight-incorrect-words') return { display: item.displayedWords.join(' '), speech: item.audioTranscript }
  if (item.taskType === 'listening-write-from-dictation') return { display: item.sentence, speech: item.sentence }
  if (item.taskType === 'speaking-read-aloud' || item.taskType === 'speaking-repeat-sentence') return { display: item.text, speech: item.text }
  if (item.taskType === 'speaking-answer-short-question') return { display: item.question, speech: item.question }
  if ('transcript' in item) return { display: item.transcript, speech: item.transcript }
  return null
}

function splitSentences(text: string) {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((part) => part.trim()).filter(Boolean)
}

export default function ListeningStudio({ items, onPractice }: { items: PracticeItem[]; onPractice: (taskType: TaskType, itemId: string) => void }) {
  const materials = useMemo(() => items.filter((item) => listeningText(item)), [items])
  const [selectedKey, setSelectedKey] = useState('')
  const [query, setQuery] = useState('')
  const [task, setTask] = useState('all')
  const [rate, setRate] = useState(1)
  const [voice, setVoice] = useState('')
  const [loop, setLoop] = useState<'off' | 'sentence' | 'track'>('off')
  const loopRef = useRef(loop)
  const [autoNext, setAutoNext] = useState(false)
  const autoNextRef = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [activeSentence, setActiveSentence] = useState(-1)
  const runId = useRef(0)
  const player = useSpeechPlayer()
  const filtered = materials.filter((item) => (task === 'all' || item.taskType === task) && `${item.id} ${TASK_CODES[item.taskType]} ${TASK_TYPE_META[item.taskType].shortLabel}`.toLowerCase().includes(query.toLowerCase().trim()))
  const selected = filtered.find((item) => itemKey(item) === selectedKey) ?? filtered[0]
  const selectedIndex = selected ? filtered.indexOf(selected) : -1
  const text = selected ? listeningText(selected) : null
  const displaySentences = text ? splitSentences(text.display) : []

  function stop() { runId.current += 1; player.stop(); setActiveSentence(-1) }
  function select(item: PracticeItem) { stop(); setSelectedKey(itemKey(item)); setRevealed(false) }

  function playMaterial(item: PracticeItem, start = 0, single = false) {
    stop()
    const id = runId.current
    const sentences = splitSentences(listeningText(item)?.speech ?? '')
    function playSentence(index: number) {
      if (id !== runId.current || !sentences[index]) return
      setActiveSentence(index)
      player.play(sentences[index], { rate, voiceURI: voice, onEnd: () => {
        if (id !== runId.current) return
        if (loopRef.current === 'sentence') playSentence(index)
        else if (!single && index + 1 < sentences.length) playSentence(index + 1)
        else if (!single && loopRef.current === 'track') playSentence(0)
        else {
          setActiveSentence(-1)
          if (!single && autoNextRef.current) {
            const next = filtered[filtered.indexOf(item) + 1]
            if (next) { setSelectedKey(itemKey(next)); setRevealed(false); playMaterial(next) }
          }
        }
      } })
    }
    playSentence(start)
  }

  return <div>
    <div className="pte-section-heading"><div><p className="pte-eyebrow">LISTEN & REPEAT</p><h2>精听跟读</h2><p className="pte-muted">{materials.length} 段练习素材 · 合成音频</p></div></div>
    <div className="pte-library-toolbar"><label className="pte-search"><Search size={17} /><input aria-label="搜索精听素材" placeholder="搜索题号或题型" value={query} onChange={(e) => { stop(); setQuery(e.target.value) }} /></label><label className="pte-select-label"><Headphones size={16} /><select aria-label="精听题型" value={task} onChange={(e) => { stop(); setTask(e.target.value) }}><option value="all">全部素材</option>{[...new Set(materials.map((item) => item.taskType))].map((type) => <option key={type} value={type}>{TASK_CODES[type]} · {TASK_TYPE_META[type].shortLabel}</option>)}</select></label></div>
    {!selected ? <div className="pte-empty"><Headphones size={28} /><h3>没有匹配的素材</h3><button className="pte-button" onClick={() => { setQuery(''); setTask('all') }}>查看全部素材</button></div> : <div className="pte-listen-grid">
      <nav className="pte-playlist" aria-label="听力素材列表">{filtered.map((item) => <button key={itemKey(item)} aria-current={item === selected ? 'true' : undefined} className={item === selected ? 'active' : ''} onClick={() => select(item)}><span className="pte-task-code skill-listening">{TASK_CODES[item.taskType]}</span><span><strong>{TASK_TYPE_META[item.taskType].shortLabel}</strong><br />#{item.id}</span></button>)}</nav>
      <section className="min-w-0">
        <div className="pte-section-heading compact"><div><h3>{TASK_TYPE_META[selected.taskType].shortLabel}</h3><p className="pte-muted">#{selected.id} · {selectedIndex + 1} / {filtered.length}</p></div><button className="pte-button" onClick={() => { stop(); onPractice(selected.taskType, selected.id) }}>去练习<ArrowRight size={15} /></button></div>
        <div className="pte-audio-player">
          <div className="pte-player-controls">
            <button className="pte-icon-button" title="上一段" aria-label="上一段" disabled={selectedIndex <= 0} onClick={() => select(filtered[selectedIndex - 1])}><SkipBack size={17} /></button>
            <button className="pte-button primary" disabled={!player.supported} onClick={() => player.status === 'idle' ? playMaterial(selected) : player.togglePause()}>{player.status === 'playing' ? <Pause size={17} /> : <Play size={17} />}{player.status === 'playing' ? '暂停' : player.status === 'paused' ? '继续播放' : '播放'}</button>
            <button className="pte-icon-button" title="停止播放" aria-label="停止播放" disabled={player.status === 'idle'} onClick={stop}><Square size={16} /></button>
            <button className="pte-icon-button" title="下一段" aria-label="下一段" disabled={selectedIndex >= filtered.length - 1} onClick={() => select(filtered[selectedIndex + 1])}><SkipForward size={17} /></button>
            <select aria-label="朗读语速" value={rate} onChange={(e) => { stop(); setRate(Number(e.target.value)) }}>{[0.75, 0.9, 1, 1.1, 1.25].map((r) => <option key={r} value={r}>{r}x</option>)}</select>
          </div>
          <div className="pte-player-controls mt-3">
            <select aria-label="循环模式" value={loop} onChange={(e) => { const value = e.target.value as typeof loop; loopRef.current = value; setLoop(value) }}><option value="off">不循环</option><option value="sentence">单句循环</option><option value="track">整段循环</option></select>
            <select aria-label="英语音色" value={voice} onChange={(e) => { stop(); setVoice(e.target.value) }}><option value="">默认英语音色</option>{player.voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</select>
            <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={autoNext} onChange={(e) => { autoNextRef.current = e.target.checked; setAutoNext(e.target.checked) }} />连续播放</label>
          </div>
          <p className="pte-player-status">{player.status === 'paused' ? '已暂停' : player.status === 'playing' ? `正在播放第 ${activeSentence + 1} 句` : '准备就绪'} · 浏览器合成音频，非官方录音</p>
          {!player.supported && <p className="pte-small-note">当前浏览器不支持语音合成，可展开文字稿阅读。</p>}
          {player.error && <p role="alert" className="text-xs text-red-600">{player.error}</p>}
        </div>
        <button className="pte-button mt-4" aria-expanded={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? '隐藏文字稿' : '查看文字稿'}</button>
        {revealed && <div className="pte-transcript">{displaySentences.map((sentence, index) => <button key={index} title={`播放第 ${index + 1} 句`} disabled={!player.supported} className={index === activeSentence ? 'active' : ''} onClick={() => playMaterial(selected, index, true)}>{sentence}</button>)}</div>}
      </section>
    </div>}
  </div>
}
