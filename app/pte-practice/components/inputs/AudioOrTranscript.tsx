'use client'

import { useEffect, useState } from 'react'

/**
 * 听力素材播放方式说明：
 *
 * 本项目没有获得授权的听力音频素材，因此不提供任何"听起来像官方录音"的
 * 音频文件。这里改用浏览器内置的 `window.speechSynthesis`（Web Speech API）
 * 朗读文字稿作为可听形式；若浏览器不支持语音合成，则直接展示文字稿并明确
 * 提示这是文字稿回退方案，而不是伪装成真实听力录音。
 *
 * `text` 用于朗读（可能包含题目答案，比如 Select Missing Word 需要完整
 * 读出结尾被省略的词才能出题）；`revealText` 用于"查看文字稿"按钮展示的
 * 内容，题目本身会剧透答案时应单独传入不含答案的版本，避免用户点一下
 * "查看文字稿"就看到正确答案。不传则退回展示 `text`。
 */
export default function AudioOrTranscript({ text, revealText }: { text: string; revealText?: string }) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  // speechSynthesis 是浏览器全局 API，朗读一旦开始不会因为这个组件被卸载
  // （比如用户点"退出"离开这道题，或切到下一题）而自动停止——之前没有这个
  // 清理逻辑，导致退出练习后语音还在继续朗读。组件卸载时主动 cancel 一次。
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function play() {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-400">
        听力素材说明：本练习没有真实听力录音，使用浏览器语音合成朗读文字稿；如浏览器不支持，可直接查看文字稿。
      </p>
      {supported ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={speaking ? stop : play}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white"
          >
            {speaking ? '停止朗读' : '▶ 朗读文字稿'}
          </button>
          <button type="button" onClick={() => setRevealed((value) => !value)} className="text-sm text-gray-500 underline">
            {revealed ? '隐藏文字稿' : '查看文字稿'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">当前浏览器不支持语音合成，已直接显示文字稿：</p>
      )}
      {(revealed || !supported) && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{revealText ?? text}</p>
      )}
    </div>
  )
}
