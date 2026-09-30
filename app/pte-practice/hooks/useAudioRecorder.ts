'use client'

import { useEffect, useRef, useState } from 'react'

interface SpeechRecognitionResultLike {
  transcript: string
}

interface MinimalSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const globalWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition ?? null
}

export interface AudioRecorderResult {
  recordingSeconds: number
  recognizedTranscript: string | null
  audioBlob: Blob | null
}

/**
 * 口语类题型共用的录音 + 可选语音识别 Hook，从 SpeakingInput.tsx 的 Read
 * Aloud 实现中提取而来，供 Repeat Sentence / Describe Image / Retell
 * Lecture / Answer Short Question 复用，避免每个题型各自重复一份
 * MediaRecorder + SpeechRecognition 逻辑。
 */
export function useAudioRecorder(onChange: (result: AudioRecorderResult) => void) {
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recognizedTranscript, setRecognizedTranscript] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const recognizedTranscriptRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      recognitionRef.current?.stop()
      // 如果用户在录音过程中直接退出（没点"停止录音"），麦克风流之前会一直
      // 挂着不释放——getUserMedia 的 stream 是浏览器级资源，不会因为这个
      // React 组件卸载就自动关闭，必须显式 stop 每个 track。这里不等
      // MediaRecorder 的 onstop 回调（那个回调里的 setState/onChange 是给
      // 正常"停止录音"流程用的，组件都卸载了不需要再触发它，也应避免在已
      // 卸载组件上调用 setState），改成先摘掉 onstop 处理器，再直接 stop
      // recorder 和底层的 stream track。
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    setPermissionError(null)
    setRecognizedTranscript(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        const seconds = (Date.now() - startTimeRef.current) / 1000
        setRecordingSeconds(seconds)
        onChange({ recordingSeconds: seconds, recognizedTranscript: recognizedTranscriptRef.current, audioBlob: blob })
      }
      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()
      recorder.start()
      setRecording(true)

      const RecognitionCtor = getSpeechRecognitionConstructor()
      if (RecognitionCtor) {
        const recognition = new RecognitionCtor()
        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.continuous = true
        let fullTranscript = ''
        recognition.onresult = (event) => {
          for (let i = 0; i < event.results.length; i += 1) {
            fullTranscript += `${event.results[i][0].transcript} `
          }
          recognizedTranscriptRef.current = fullTranscript.trim()
          setRecognizedTranscript(fullTranscript.trim())
        }
        recognition.onerror = () => {
          // 语音识别失败时静默忽略，内容维度会回退为占位分。
        }
        recognitionRef.current = recognition
        recognition.start()
      }
    } catch {
      setPermissionError('无法访问麦克风，请检查浏览器权限设置后重试。')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return { permissionError, recording, audioUrl, recordingSeconds, recognizedTranscript, startRecording, stopRecording }
}
