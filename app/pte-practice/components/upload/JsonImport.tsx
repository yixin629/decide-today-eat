'use client'

import { FileJson, Upload } from 'lucide-react'
import { useState } from 'react'
import { applyProvenanceTemplate, parseImportJson, type NewPracticeItem } from '../../lib/custom-items'
import { getItemsForTaskType } from '../../lib/questionBank'
import { TASK_TYPE_META } from '../../lib/taskTypes'
import { TASK_CODES } from '../../lib/study'
import { TASK_TYPES, type TaskType } from '../../types'
import ProvenanceFields, { EMPTY_PROVENANCE, provenanceTemplate, type ProvenanceDraft } from './ProvenanceFields'

const MAX_FILE_BYTES = 500_000

export default function JsonImport({ canSave, onSave }: { canSave: boolean; onSave: (items: NewPracticeItem[]) => Promise<boolean> }) {
  const [text, setText] = useState('')
  const [exampleType, setExampleType] = useState<TaskType>('reading-mcq-single')
  const [errors, setErrors] = useState<string[]>([])
  const [ready, setReady] = useState<NewPracticeItem[]>([])
  const [saving, setSaving] = useState(false)
  const [provenance, setProvenance] = useState<ProvenanceDraft>(EMPTY_PROVENANCE)
  const [notice, setNotice] = useState<string | null>(null)

  function check(value = text) {
    const result = parseImportJson(value, provenance.commercialUseAllowed)
    setErrors(result.errors)
    setReady(result.items)
    return result
  }

  function fillExample() {
    const example = getItemsForTaskType(exampleType)[0]
    if (!example) return
    const rest: Record<string, unknown> = { ...example }
    delete rest.id
    rest.provenance = provenanceTemplate(provenance)
    const value = JSON.stringify([rest], null, 2)
    setText(value)
    if (provenance.commercialUseAllowed) check(value)
  }

  function applyTemplate() {
    const result = applyProvenanceTemplate(text, provenanceTemplate(provenance))
    if (result.error) { setErrors([result.error]); setReady([]); return }
    setText(result.text)
    setReady([])
    setErrors([])
    setNotice(result.filled ? `已为 ${result.filled} 道题写入来源模板，请检查后再校验。` : '所有题目都已带有 provenance，未做修改。')
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) { setErrors(['文件过大（最多 500KB）']); setReady([]); return }
    const value = await file.text()
    setText(value)
    if (provenance.commercialUseAllowed) check(value)
  }

  async function save() {
    if (saving) return
    const result = check()
    if (result.errors.length || !result.items.length) return
    setSaving(true)
    const ok = await onSave(result.items)
    setSaving(false)
    if (ok) { setText(''); setReady([]) }
  }

  return <div className="space-y-4">
    <p className="pte-small-note">支持单个题目对象或题目数组（一次最多 50 题），格式与内置题库一致，id 会自动生成。可以先选择题型填入示例再修改。</p>
    <div className="flex flex-wrap items-center gap-3">
      <label className="pte-select-label"><FileJson size={16} /><select aria-label="示例题型" value={exampleType} onChange={(e) => setExampleType(e.target.value as TaskType)}>{TASK_TYPES.map((t) => <option key={t} value={t}>{TASK_CODES[t]} · {TASK_TYPE_META[t].shortLabel}</option>)}</select></label>
      <button type="button" className="pte-button" onClick={fillExample}>填入示例</button>
      <label className="pte-button cursor-pointer"><Upload size={16} />选择 JSON 文件<input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = '' }} /></label>
    </div>
    <label className="pte-upload-field">
      <span>题目 JSON</span>
      <textarea rows={14} spellCheck={false} className="font-mono text-xs" value={text} placeholder='[{ "taskType": "reading-mcq-single", "passage": "...", "question": "...", "options": ["...", "..."], "correctIndex": 0 }]' onChange={(e) => { setText(e.target.value); setReady([]); setErrors([]); setNotice(null) }} />
    </label>
    <ProvenanceFields mode="json" value={provenance} onChange={(next) => { setProvenance(next); setReady([]); setErrors([]) }} />
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="pte-button" disabled={!text.trim()} onClick={applyTemplate}>写入来源模板</button>
      {notice && <span className="pte-small-note" role="status">{notice}</span>}
    </div>
    {errors.length > 0 && <ul className="pte-upload-errors" role="alert">{errors.slice(0, 20).map((error) => <li key={error}>{error}</li>)}</ul>}
    {ready.length > 0 && !errors.length && <p className="pte-small-note" role="status">校验通过：{ready.length} 道题可以导入。</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" className="pte-button" disabled={!text.trim()} onClick={() => check()}>校验</button>
      <button type="button" className="pte-button primary" disabled={!canSave || saving || !text.trim()} onClick={() => void save()}><Upload size={16} />{saving ? '导入中…' : '导入到题库'}</button>
    </div>
  </div>
}
