'use client'

import { ArrowRight, Eye, EyeOff, Headphones, Pause, Play, Search, SkipBack, SkipForward, Square } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useAudioPreferences } from '../hooks/useAudioPreferences'
import { useSpeechPlayer } from '../hooks/useSpeechPlayer'
import { accentLabel, accentOf, pickVoice, voiceName } from '../lib/voices'
import AudioSettings from './audio/AudioSettings'
import TaskTypePicker, { type SkillFilter } from './TaskTypePicker'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { itemKey, TASK_CODES } from '../lib/study'
import type { PracticeItem, TaskType } from '../types'

function listeningText(item: PracticeItem): { display: string; speech: string } | null {
  if (item.taskType === 'listening-select-missing-word') return { display: item.displayedTranscript, speech: item.displayedTranscript.split('____')[0] }
  if (item.taskType === 'listening-highlight-incorrect-words') return { display: item.displayedWords.join(' '), speech: item.audioTranscript }
  if (item.taskType === 'listening-write-from-dictation') return { display: item.sentence, speech: item.sentence }
  if (item.taskType === 'speaking-read-aloud' || item.taskType === 'speaking-repeat-sentence') return { display: item.text, speech: item.text }
  if (item.taskType === 'speaking-answer-short-question') return { display: item.question, speech: item.question }
  if (item.taskType === 'speaking-summarize-group-discussion') return { display: item.turns.map((turn) => `${turn.speaker}: ${turn.text}`).join(' '), speech: item.turns.map((turn) => turn.text).join(' ') }
  if (item.taskType === 'speaking-respond-to-situation') return { display: item.situation, speech: item.situation }
  if ('transcript' in item) return { display: item.transcript, speech: item.transcript }
  return null
}

const LOOP_MODES = [['off', '不循环'], ['sentence', '单句循环'], ['track', '整段循环']] as const

function splitSentences(text: string) {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((part) => part.trim()).filter(Boolean)
}

export default function ListeningStudio({ items, onPractice }: { items: PracticeItem[]; onPractice: (taskType: TaskType, itemId: string) => void }) {
  const materials = useMemo(() => items.filter((item) => listeningText(item)), [items])
  const [selectedKey, setSelectedKey] = useState('')
  const [query, setQuery] = useState('')
  const [task, setTask] = useState<TaskType | 'all'>('all')
  const [skill, setSkill] = useState<SkillFilter>('all')
  const { prefs, update } = useAudioPreferences()
  const [loop, setLoop] = useState<'off' | 'sentence' | 'track'>('off')
  const loopRef = useRef(loop)
  const [autoNext, setAutoNext] = useState(false)
  const autoNextRef = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [activeSentence, setActiveSentence] = useState(-1)
  const runId = useRef(0)
  const player = useSpeechPlayer()
  const types = [...new Set(materials.map((item) => item.taskType))]
  const counts: Partial<Record<TaskType, number>> = {}
  for (const item of materials) counts[item.taskType] = (counts[item.taskType] ?? 0) + 1
  const filtered = materials.filter((item) => (task === 'all' ? skill === 'all' || TASK_TYPE_META[item.taskType].skill === skill : item.taskType === task) && `${item.id} ${TASK_CODES[item.taskType]} ${TASK_TYPE_META[item.taskType].shortLabel}`.toLowerCase().includes(query.toLowerCase().trim()))
  const selected = filtered.find((item) => itemKey(item) === selectedKey) ?? filtered[0]
  const selectedIndex = selected ? filtered.indexOf(selected) : -1
  const text = selected ? listeningText(selected) : null
  const displaySentences = text ? splitSentences(text.display) : []
  const currentVoice = selected ? pickVoice(player.voices, prefs, itemKey(selected)) : null

  function stop() { runId.current += 1; player.stop(); setActiveSentence(-1) }
  function select(item: PracticeItem) { stop(); setSelectedKey(itemKey(item)); setRevealed(false) }

  function playMaterial(item: PracticeItem, start = 0, single = false) {
    stop()
    const id = runId.current
    const sentences = splitSentences(listeningText(item)?.speech ?? '')
    const voice = pickVoice(player.voices, prefs, itemKey(item))
    function playSentence(index: number) {
      if (id !== runId.current || !sentences[index]) return
      setActiveSentence(index)
      player.play(sentences[index], { rate: prefs.rate, voice, onEnd: () => {
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
    <div className="pte-library-toolbar"><label className="pte-search"><Search size={17} /><input aria-label="搜索精听素材" placeholder="搜索题号或题型" value={query} onChange={(e) => { stop(); setQuery(e.target.value) }} /></label></div>
    <TaskTypePicker label="精听素材题型" skill={skill} task={task} types={types} counts={counts} onChange={(next) => { stop(); setSkill(next.skill); setTask(next.task) }} />
    {!selected ? <div className="pte-empty"><Headphones size={28} /><h3>没有匹配的素材</h3><button className="pte-button" onClick={() => { setQuery(''); setTask('all'); setSkill('all') }}>查看全部素材</button></div> : <div className="pte-listen-grid">
      <nav className="pte-playlist" aria-label="听力素材列表">{filtered.map((item) => <button key={itemKey(item)} aria-current={item === selected ? 'true' : undefined} className={item === selected ? 'active' : ''} onClick={() => select(item)}><span className="pte-task-code skill-listening">{TASK_CODES[item.taskType]}</span><span><strong>{TASK_TYPE_META[item.taskType].shortLabel}</strong><br />#{item.id}</span></button>)}</nav>
      <section className="min-w-0">
        <div className="pte-section-heading compact"><div><h3>{TASK_TYPE_META[selected.taskType].shortLabel}</h3><p className="pte-muted">#{selected.id} · {selectedIndex + 1} / {filtered.length}</p></div><button className="pte-button" onClick={() => { stop(); onPractice(selected.taskType, selected.id) }}>去练习<ArrowRight size={15} /></button></div>
        <div className="pte-audio-player">
          <div className="pte-player-controls">
            <button className="pte-icon-button" title="上一段" aria-label="上一段" disabled={selectedIndex <= 0} onClick={() => select(filtered[selectedIndex - 1])}><SkipBack size={17} /></button>
            <button className="pte-button primary" disabled={!player.supported} onClick={() => player.status === 'idle' ? playMaterial(selected) : player.togglePause()}>{player.status === 'playing' ? <Pause size={17} /> : <Play size={17} />}{player.status === 'playing' ? '暂停' : player.status === 'paused' ? '继续播放' : '播放'}</button>
            <button className="pte-icon-button" title="停止播放" aria-label="停止播放" disabled={player.status === 'idle'} onClick={stop}><Square size={16} /></button>
            <button className="pte-icon-button" title="下一段" aria-label="下一段" disabled={selectedIndex >= filtered.length - 1} onClick={() => select(filtered[selectedIndex + 1])}><SkipForward size={17} /></button>
          </div>
          <div className="pte-player-controls mt-3">
            <div className="pte-chip-group" role="group" aria-label="循环模式">{LOOP_MODES.map(([value, label]) => <button key={value} type="button" aria-pressed={loop === value} className={loop === value ? 'active' : ''} onClick={() => { loopRef.current = value; setLoop(value) }}>{label}</button>)}</div>
            <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={autoNext} onChange={(e) => { autoNextRef.current = e.target.checked; setAutoNext(e.target.checked) }} />连续播放</label>
          </div>
          <p className="pte-player-status">{player.status === 'paused' ? '已暂停' : player.status === 'playing' ? `正在播放第 ${activeSentence + 1} 句` : '准备就绪'} · {currentVoice ? `${accentLabel(accentOf(currentVoice))}口音 · ${voiceName(currentVoice)}` : '默认音色'} · {prefs.rate}x · 浏览器合成音频，非官方录音</p>
          {player.supported && <AudioSettings voices={player.voices} prefs={prefs} onChange={(patch) => { stop(); update(patch) }} />}
          {!player.supported && <p className="pte-small-note">当前浏览器不支持语音合成，可展开文字稿阅读。</p>}
          {player.error && <p role="alert" className="text-xs text-red-600">{player.error}</p>}
        </div>
        <button className="pte-button mt-4" aria-expanded={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? '隐藏文字稿' : '查看文字稿'}</button>
        {revealed && <div className="pte-transcript">{displaySentences.map((sentence, index) => <button key={index} title={`播放第 ${index + 1} 句`} disabled={!player.supported} className={index === activeSentence ? 'active' : ''} onClick={() => playMaterial(selected, index, true)}>{sentence}</button>)}</div>}
      </section>
    </div>}
  </div>
}
