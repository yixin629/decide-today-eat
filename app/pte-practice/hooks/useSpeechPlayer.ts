'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechPlayer() {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)

  const stop = useCallback(() => {
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null }
    utterance.current = null
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setStatus('idle')
  }, [])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    setSupported(true)
    const synth = window.speechSynthesis
    const refreshVoices = () => setVoices(synth.getVoices().filter((voice) => /^en\b/i.test(voice.lang)))
    refreshVoices()
    synth.addEventListener('voiceschanged', refreshVoices)
    return () => {
      synth.removeEventListener('voiceschanged', refreshVoices)
      if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null }
      synth.cancel()
    }
  }, [])

  const play = useCallback((text: string, options: { rate?: number; voiceURI?: string; onEnd?: () => void } = {}) => {
    stop()
    if (!supported || !text.trim()) return
    setError(null)
    const next = new SpeechSynthesisUtterance(text)
    next.lang = 'en-US'
    next.rate = options.rate ?? 1
    next.voice = voices.find((voice) => voice.voiceURI === options.voiceURI) ?? null
    next.onend = () => { if (utterance.current === next) { setStatus('idle'); options.onEnd?.() } }
    next.onerror = (event) => {
      if (utterance.current !== next) return
      setStatus('idle')
      if (event.error !== 'canceled' && event.error !== 'interrupted') setError('音频播放失败，请重试或选择其他英语音色。')
    }
    utterance.current = next
    setStatus('playing')
    window.speechSynthesis.speak(next)
  }, [stop, supported, voices])

  function togglePause() {
    if (!supported) return
    if (status === 'playing') { window.speechSynthesis.pause(); setStatus('paused') }
    else if (status === 'paused') { window.speechSynthesis.resume(); setStatus('playing') }
  }

  return { supported, status, error, voices, play, stop, togglePause }
}
