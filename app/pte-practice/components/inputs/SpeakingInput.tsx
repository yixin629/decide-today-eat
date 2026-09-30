'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnswerShortQuestionItem, DescribeImageItem, ReadAloudItem, RepeatSentenceItem, RetellLectureItem } from '../../types'
import { useAudioRecorder, type AudioRecorderResult } from '../../hooks/useAudioRecorder'
import AudioOrTranscript from './AudioOrTranscript'

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
  onChange: (payload: { recordingSeconds: number; recognizedTranscript: string | null; audioBlob: Blob | null }) => void
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

/** 通用的录音控制条 UI，供下面几个新口语题型复用 useAudioRecorder 的状态渲染。 */
function RecorderControls({
  hint,
  onChange,
}: {
  hint: string
  onChange: (result: AudioRecorderResult) => void
}) {
  const { permissionError, recording, audioUrl, recordingSeconds, recognizedTranscript, startRecording, stopRecording } = useAudioRecorder(onChange)
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">{hint}</p>
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

export function RepeatSentenceInput({ item, onChange }: { item: RepeatSentenceItem; onChange: (result: AudioRecorderResult) => void }) {
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.text} />
      <RecorderControls hint="听完（或阅读文字稿）后立即复述句子并录音，本练习不做真实发音评分。" onChange={onChange} />
    </div>
  )
}

/** 用原创 SVG 绘制的简单柱状图/折线图，代替官方看图说话使用的真实图片。 */
function DescribeImageChartSvg({ chart }: { chart: DescribeImageItem['chart'] }) {
  const width = 320
  const height = 200
  const padding = 32
  const max = Math.max(...chart.values, 1)
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2

  if (chart.type === 'bar') {
    const barWidth = plotWidth / chart.values.length / 1.6
    return (
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title} className="w-full max-w-sm">
        <line x1={padding} y1={height - padding} x2={width - padding / 2} y2={height - padding} stroke="currentColor" className="text-gray-300" />
        <line x1={padding} y1={padding / 2} x2={padding} y2={height - padding} stroke="currentColor" className="text-gray-300" />
        {chart.values.map((value, index) => {
          const barHeight = (value / max) * plotHeight
          const x = padding + (index + 0.3) * (plotWidth / chart.values.length)
          const y = height - padding - barHeight
          return (
            <g key={index}>
              <rect x={x} y={y} width={barWidth} height={barHeight} className="fill-primary/70" />
              <text x={x + barWidth / 2} y={height - padding + 14} textAnchor="middle" className="fill-gray-600 text-[9px]">
                {chart.categories[index]}
              </text>
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-gray-700 text-[9px]">
                {value}
                {chart.unit ?? ''}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  const points = chart.values.map((value, index) => {
    const x = padding + (index / Math.max(chart.values.length - 1, 1)) * plotWidth
    const y = height - padding - (value / max) * plotHeight
    return { x, y }
  })
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title} className="w-full max-w-sm">
      <line x1={padding} y1={height - padding} x2={width - padding / 2} y2={height - padding} stroke="currentColor" className="text-gray-300" />
      <line x1={padding} y1={padding / 2} x2={padding} y2={height - padding} stroke="currentColor" className="text-gray-300" />
      <path d={path} fill="none" strokeWidth={2} className="stroke-primary" />
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r={3} className="fill-primary" />
          <text x={point.x} y={height - padding + 14} textAnchor="middle" className="fill-gray-600 text-[9px]">
            {chart.categories[index]}
          </text>
          <text x={point.x} y={point.y - 6} textAnchor="middle" className="fill-gray-700 text-[9px]">
            {chart.values[index]}
            {chart.unit ?? ''}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function DescribeImageInput({ item, onChange }: { item: DescribeImageItem; onChange: (result: AudioRecorderResult) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-gray-700">{item.chart.title}</p>
        <DescribeImageChartSvg chart={item.chart} />
      </div>
      <p className="text-xs text-gray-400">
        图表为本练习使用 SVG 原创绘制，并非 Pearson 官方真题图片。请在准备时间后用约 40 秒描述图表的主要趋势或对比。
      </p>
      <RecorderControls hint="描述完成后停止录音，本练习不做真实发音评分。" onChange={onChange} />
    </div>
  )
}

export function RetellLectureInput({ item, onChange }: { item: RetellLectureItem; onChange: (result: AudioRecorderResult) => void }) {
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.transcript} />
      <RecorderControls hint="听完讲座（或阅读文字稿）并准备后，口头复述其要点并录音。" onChange={onChange} />
    </div>
  )
}

export function AnswerShortQuestionInput({ item, onChange }: { item: AnswerShortQuestionItem; onChange: (result: AudioRecorderResult) => void }) {
  return (
    <div className="space-y-4">
      <AudioOrTranscript text={item.question} />
      <RecorderControls hint="用 1-3 个词口头回答问题并录音。若浏览器支持语音识别，会用转写文本与参考答案做精确匹配。" onChange={onChange} />
    </div>
  )
}
