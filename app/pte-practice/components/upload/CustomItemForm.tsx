'use client'

import { Eye, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import { buildFromFields, CUSTOM_FIELDS, defaultValues, validateCustomItem, type FieldValues, type NewPracticeItem } from '../../lib/custom-items'
import { TASK_TYPE_META } from '../../lib/taskTypes'
import { SKILL_NAMES, STUDY_SKILLS, TASK_CODES } from '../../lib/study'
import { TASK_TYPES, type PracticeItem, type TaskType } from '../../types'
import PracticeInput from '../session/PracticeInput'

export default function CustomItemForm({ canSave, onSave }: { canSave: boolean; onSave: (items: NewPracticeItem[]) => Promise<boolean> }) {
  const [taskType, setTaskType] = useState<TaskType>('reading-mcq-single')
  const [values, setValues] = useState<FieldValues>(() => defaultValues('reading-mcq-single'))
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<PracticeItem | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [saving, setSaving] = useState(false)

  function changeTask(next: TaskType) {
    setTaskType(next)
    setValues(defaultValues(next))
    setErrors([])
    setPreview(null)
  }

  function validate() {
    const { item, errors: found } = validateCustomItem(buildFromFields(taskType, values))
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
    <label className="pte-upload-field">
      <span>题型</span>
      <select value={taskType} onChange={(e) => changeTask(e.target.value as TaskType)}>
        {STUDY_SKILLS.map((skill) => <optgroup key={skill} label={SKILL_NAMES[skill]}>{TASK_TYPES.filter((t) => TASK_TYPE_META[t].skill === skill).map((t) => <option key={t} value={t}>{TASK_CODES[t]} · {TASK_TYPE_META[t].shortLabel}</option>)}</optgroup>)}
      </select>
    </label>
    <p className="pte-small-note">题目内容请使用英文；带 {'{ }'} 的写法会自动转换成空格或标记。</p>
    {CUSTOM_FIELDS[taskType].map((field) => <label key={`${taskType}-${field.key}`} className="pte-upload-field">
      <span>{field.label}</span>
      {field.kind === 'textarea' ? <textarea rows={field.key === 'options' || field.key === 'acceptableAnswers' ? 5 : 7} placeholder={field.placeholder} value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
        : field.kind === 'chart-type' ? <select value={values[field.key] ?? 'bar'} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}><option value="bar">柱状图</option><option value="line">折线图</option></select>
        : <input type={field.kind === 'number' ? 'number' : 'text'} placeholder={field.placeholder} value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />}
      {field.help && <small>{field.help}</small>}
    </label>)}
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
