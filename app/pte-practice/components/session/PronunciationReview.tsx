'use client'

import { Play, Square, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { alignWords, type WordStatus } from '../../engine/wordAlignment'
import { useAudioPreferences } from '../../hooks/useAudioPreferences'
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer'
import { pickVoice } from '../../lib/voices'

const LEGEND: { status: WordStatus; label: string }[] = [
  { status: 'good', label: '清晰一致' },
  { status: 'weak', label: '发音不准' },
  { status: 'missed', label: '漏读/读错' },
]

/** Read Aloud / Repeat Sentence 提交后的逐词标注：绿色一致、黄色读音接近但不准、红色漏读或读错。 */
export default function PronunciationReview({ referenceText, transcript, audioBlob }: { referenceText: string; transcript: string | null; audioBlob?: Blob | null }) {
  const alignment = useMemo(() => (transcript ? alignWords(referenceText, transcript) : null), [referenceText, transcript])
  const player = useSpeechPlayer()
  const { prefs } = useAudioPreferences()
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [activeWord, setActiveWord] = useState<number | null>(null)

  useEffect(() => {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    setRecordingUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioBlob])

  function speak(text: string, index: number | null = null) {
    setActiveWord(index)
    player.play(text, { rate: index === null ? prefs.rate : Math.min(prefs.rate, 0.9), voice: pickVoice(player.voices, prefs, referenceText), onEnd: () => setActiveWord(null) })
  }

  return <section className="pte-pron-review" aria-label="逐词发音标注">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3>逐词发音</h3>
      {alignment && <div className="pte-pron-legend">{LEGEND.map(({ status, label }) => <span key={status} className={`pte-pron-dot ${status}`}>{label} {alignment.counts[status]}</span>)}</div>}
    </div>

    {!alignment ? <p className="pte-small-note">没有获得语音转写（浏览器不支持实时转写或录音太短），无法逐词标注。可以回放录音，对照原文自查。</p> : <>
      <p className="pte-pron-text">
        {alignment.words.map((word, index) => <button key={index} type="button" disabled={!player.supported} className={`pte-pron-word ${word.status} ${activeWord === index ? 'speaking' : ''}`} title={word.status === 'good' ? '点击听标准发音' : word.heard ? `识别为 "${word.heard}"，点击听标准发音` : '未识别到，点击听标准发音'} onClick={() => speak(word.text.replace(/[^\p{L}\p{N}'-]/gu, ''), index)}>
          {word.text}{word.status !== 'good' && word.heard && <small>{word.heard}</small>}
        </button>)}
      </p>
      {alignment.extras.length > 0 && <p className="pte-small-note">多读的词：{alignment.extras.join('、')}</p>}
      <p className="pte-small-note">点击任意单词听标准发音。标注基于语音识别结果：识别器会自动纠正轻微口音，也可能漏掉弱读的 a、the 等虚词，结果仅供练习参考。</p>
    </>}

    <div className="pte-pron-actions">
      <button type="button" className="pte-button" disabled={!player.supported} onClick={() => (player.status === 'idle' ? speak(referenceText) : player.stop())}>
        {player.status === 'idle' ? <Play size={15} /> : <Square size={15} />}{player.status === 'idle' ? '听原文示范' : '停止'}
      </button>
      {recordingUrl && <span className="inline-flex flex-wrap items-center gap-2 text-xs text-gray-500"><Volume2 size={15} />我的录音<audio src={recordingUrl} controls aria-label="对照回放我的录音" className="h-9" /></span>}
    </div>
  </section>
}
