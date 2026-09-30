'use client'

import type { AnswerShortQuestionItem, DescribeImageItem, ReadAloudItem, RepeatSentenceItem, RetellLectureItem } from '../../types'
import { useAudioRecorder, type AudioRecorderResult } from '../../hooks/useAudioRecorder'
import AudioOrTranscript from './AudioOrTranscript'

export function ReadAloudInput({
  item,
  onChange,
}: {
  item: ReadAloudItem
  onChange: (payload: { recordingSeconds: number; recognizedTranscript: string | null; audioBlob: Blob | null }) => void
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-4 text-base leading-relaxed text-gray-800">{item.text}</p>
      <RecorderControls
        hint="本练习使用 MediaRecorder 录音，仅支持回放，不做真实发音评分；若浏览器支持语音识别，会额外生成一份粗略转写文本用于内容匹配估算。"
        onChange={onChange}
      />
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
