'use client'

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RecordingContext } from '../components/session/RecordingContext'

interface MinimalSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

export interface AudioRecorderResult {
  recordingSeconds: number
  recognizedTranscript: string | null
  audioBlob: Blob | null
}

export function useAudioRecorder(onChange: (result: AudioRecorderResult) => void) {
  const coordinator = useContext(RecordingContext)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recognizedTranscript, setRecognizedTranscript] = useState<string | null>(null)
  const mounted = useRef(false)
  const requesting = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const transcriptRef = useRef<string | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const startTimeRef = useRef(0)
  const stoppedAtRef = useRef(0)
  const onChangeRef = useRef(onChange)
  const pendingStop = useRef<Promise<void> | null>(null)
  const resolveStop = useRef<(() => void) | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const finalizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const stopRecording = useCallback((): Promise<void> => {
    if (requesting.current) return Promise.reject(new Error('麦克风权限仍在等待确认，请完成授权后再提交。'))
    if (pendingStop.current) return pendingStop.current
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return Promise.resolve()
    pendingStop.current = new Promise<void>((resolve) => { resolveStop.current = resolve })
    stoppedAtRef.current = Date.now()
    recognitionRef.current?.stop()
    recorder.stop()
    setRecording(false)
    return pendingStop.current
  }, [])

  useEffect(() => {
    if (coordinator) coordinator.current = stopRecording
    return () => { if (coordinator) coordinator.current = null }
  }, [coordinator, stopRecording])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const recorder = recorderRef.current
      if (recorder) {
        recorder.onstop = null
        recorder.ondataavailable = null
        if (recorder.state !== 'inactive') recorder.stop()
      }
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      if (finalizeTimer.current) clearTimeout(finalizeTimer.current)
      resolveStop.current?.()
    }
  }, [])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setRecordingSeconds((Date.now() - startTimeRef.current) / 1000), 200)
    return () => window.clearInterval(timer)
  }, [recording])

  async function startRecording() {
    if (requesting.current || recorderRef.current?.state === 'recording' || pendingStop.current) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setPermissionError('当前浏览器不支持录音。请在 HTTPS 或 localhost 上使用支持录音的浏览器。')
      return
    }
    requesting.current = true
    setStarting(true)
    setPermissionError(null)
    setRecognitionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
      setAudioUrl(null)
      transcriptRef.current = null
      setRecognizedTranscript(null)
      setRecordingSeconds(0)
      chunksRef.current = []
      onChangeRef.current({ recordingSeconds: 0, recognizedTranscript: null, audioBlob: null })
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const seconds = ((stoppedAtRef.current || Date.now()) - startTimeRef.current) / 1000
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        // Allow the final recognition event to arrive before submitting the completed blob.
        finalizeTimer.current = setTimeout(() => {
          if (mounted.current) {
            const url = URL.createObjectURL(blob)
            audioUrlRef.current = url
            setAudioUrl(url)
            setRecordingSeconds(seconds)
            setRecording(false)
            onChangeRef.current({ recordingSeconds: seconds, recognizedTranscript: transcriptRef.current, audioBlob: blob })
          }
          resolveStop.current?.()
          pendingStop.current = null
          resolveStop.current = null
        }, 180)
      }
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop())
        recognitionRef.current?.stop()
        if (mounted.current) { setPermissionError('录音发生错误，请重试。'); setRecording(false) }
        resolveStop.current?.()
        pendingStop.current = null
      }
      recorderRef.current = recorder
      startTimeRef.current = Date.now()
      stoppedAtRef.current = 0
      recorder.start()
      setRecording(true)
      const speechWindow = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (Recognition) {
        const recognition = new Recognition()
        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.continuous = true
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim()
          transcriptRef.current = transcript
          if (mounted.current) setRecognizedTranscript(transcript)
        }
        recognition.onerror = () => { if (mounted.current) setRecognitionError('实时转写不可用，录音仍可正常回放。') }
        recognitionRef.current = recognition
        try { recognition.start() } catch { setRecognitionError('实时转写未能启动，录音仍可正常回放。') }
      } else setRecognitionError('当前浏览器不支持实时转写，录音仍可正常回放。')
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (mounted.current) { setPermissionError('无法访问麦克风，请检查浏览器权限设置后重试。'); setRecording(false) }
    } finally {
      requesting.current = false
      if (mounted.current) setStarting(false)
    }
  }

  return { permissionError, recognitionError, recording, starting, audioUrl, recordingSeconds, recognizedTranscript, startRecording, stopRecording }
}
