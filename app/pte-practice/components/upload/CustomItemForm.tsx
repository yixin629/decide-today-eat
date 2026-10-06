'use client'

import { Eye, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import { buildFromFields, CUSTOM_FIELDS, defaultValues, validateCustomItem, type FieldValues, type NewPracticeItem } from '../../lib/custom-items'
import { TASK_TYPE_META } from '../../lib/taskTypes'
import type { PracticeItem, TaskType } from '../../types'
import TaskTypePicker from '../TaskTypePicker'
import PracticeInput from '../session/PracticeInput'
import ProvenanceFields, { EMPTY_PROVENANCE, provenancePayload, type ProvenanceDraft } from './ProvenanceFields'

export default function CustomItemForm({ canSave, onSave }: { canSave: boolean; onSave: (items: NewPracticeItem[]) => Promise<boolean> }) {
  const [taskType, setTaskType] = useState<TaskType>('reading-mcq-single')
  const [values, setValues] = useState<FieldValues>(() => defaultValues('reading-mcq-single'))
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<PracticeItem | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [provenance, setProvenance] = useState<ProvenanceDraft>(EMPTY_PROVENANCE)

  function changeTask(next: TaskType) {
    setTaskType(next)
    setValues(defaultValues(next))
    setErrors([])
    setPreview(null)
  }

  function validate() {
    const { item, errors: found } = validateCustomItem({ ...buildFromFields(taskType, values), provenance: provenancePayload(provenance) })
    setErrors(found)
    return item
  }

  function showPreview() {
    const item = validate()
    setPreview(item ? ({ ...item, id: 'preview' } as PracticeItem) : null)
    setPreviewKey((key) => key + 1)
  }

  async function save() {
    if (saving) return
    const item = validate()
    if (!item) return
    setSaving(true)
    const ok = await onSave([item])
    setSaving(false)
    if (ok) { setValues(defaultValues(taskType)); setPreview(null) }
  }

  return <div className="space-y-4">
    <div className="pte-upload-field">
      <span>题型 · {TASK_TYPE_META[taskType].label}</span>
      <TaskTypePicker label="上传题型" allowAll={false} skill={TASK_TYPE_META[taskType].skill} task={taskType} onChange={(next) => { if (next.task !== 'all' && next.task !== taskType) changeTask(next.task) }} />
    </div>
    <p className="pte-small-note">题目内容请使用英文；带 {'{ }'} 的写法会自动转换成空格或标记。</p>
    {CUSTOM_FIELDS[taskType].map((field) => <label key={`${taskType}-${field.key}`} className="pte-upload-field">
      <span>{field.label}</span>
      {field.kind === 'textarea' ? <textarea rows={field.key === 'options' || field.key === 'acceptableAnswers' ? 5 : 7} placeholder={field.placeholder} value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
        : field.kind === 'chart-type' ? <select value={values[field.key] ?? 'bar'} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}><option value="bar">柱状图</option><option value="line">折线图</option></select>
        : <input type={field.kind === 'number' ? 'number' : 'text'} placeholder={field.placeholder} value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />}
      {field.help && <small>{field.help}</small>}
    </label>)}
    <ProvenanceFields value={provenance} onChange={setProvenance} />
    {errors.length > 0 && <ul className="pte-upload-errors" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
    <div className="flex flex-wrap gap-3">
      <button type="button" className="pte-button" onClick={showPreview}><Eye size={16} />预览</button>
      <button type="button" className="pte-button primary" disabled={!canSave || saving} onClick={() => void save()}><Save size={16} />{saving ? '保存中…' : '保存到题库'}</button>
      <button type="button" className="pte-button" onClick={() => changeTask(taskType)}><RotateCcw size={16} />清空</button>
    </div>
    {preview && <section className="pte-upload-preview" aria-label="题目预览">
      <p className="pte-eyebrow">PREVIEW</p>
      <PracticeInput key={previewKey} item={preview} onChange={() => undefined} />
    </section>}
  </div>
}
