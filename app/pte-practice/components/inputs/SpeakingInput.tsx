'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReadAloudItem } from '../../types'

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

export function ReadAloudInput({
  item,
  onChange,
}: {
  item: ReadAloudItem
  onChange: (payload: { recordingSeconds: number; recognizedTranscript: string | null }) => void
}) {
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recognizedTranscript, setRecognizedTranscript] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const recognizedTranscriptRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      recognitionRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    setPermissionError(null)
    setRecognizedTranscript(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
        const seconds = (Date.now() - startTimeRef.current) / 1000
        setRecordingSeconds(seconds)
        onChange({ recordingSeconds: seconds, recognizedTranscript: recognizedTranscriptRef.current })
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

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-4 text-base leading-relaxed text-gray-800">{item.text}</p>
      <p className="text-xs text-gray-400">
        本练习使用 MediaRecorder 录音，仅支持回放，不做真实发音评分；若浏览器支持语音识别，会额外生成一份粗略转写文本用于内容匹配估算。
      </p>
      {permissionError && <p className="text-sm text-red-600">{permissionError}</p>}
      <div className="flex items-center gap-3">
        {!recording ? (
          <button type="button" onClick={startRecording} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white">
            ● 开始录音
          </button>
        ) : (
          <button type="button" onClick={stopRecording} className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white">
            ■ 停止录音
          </button>
        )}
        {audioUrl && <audio src={audioUrl} controls className="h-9" />}
      </div>
      {recordingSeconds > 0 && <p className="text-sm text-gray-500">录音时长：{recordingSeconds.toFixed(1)} 秒</p>}
      {recognizedTranscript && <p className="text-sm text-gray-500">识别到的转写文本（仅供参考）：{recognizedTranscript}</p>}
    </div>
  )
}
