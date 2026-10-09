'use client'

import { ArrowRight, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { NewPracticeItem } from '../../lib/custom-items'
import { deleteCustomItem, saveCustomItems, updateCustomItem, type CustomItemInfo } from '../../lib/item-repository'
import { TASK_TYPE_META } from '../../lib/taskTypes'
import { itemKey, itemPreview, itemSourceLabel, TASK_CODES } from '../../lib/study'
import type { PracticeItem, TaskType } from '../../types'
import CustomItemForm from './CustomItemForm'
import JsonImport from './JsonImport'

export default function QuestionUploader({ items, customItems, userId, onChanged, onPractice }: {
  items: PracticeItem[]
  customItems: CustomItemInfo[]
  userId: string | null
  onChanged: () => void
  onPractice: (taskType: TaskType, itemId: string) => void
}) {
  const [mode, setMode] = useState<'form' | 'json'>('form')
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<PracticeItem | null>(null)
  const infoByKey = new Map(customItems.map((info) => [info.key, info]))
  const mine = items.filter((item) => infoByKey.has(itemKey(item)))
    .sort((a, b) => (infoByKey.get(itemKey(b))?.createdAt ?? '').localeCompare(infoByKey.get(itemKey(a))?.createdAt ?? ''))

  async function save(newItems: NewPracticeItem[]) {
    if (!userId) return false
    setMessage(null)
    const { saved, error } = await saveCustomItems(newItems, userId)
    if (error) { setMessage({ type: 'error', text: error }); return false }
    setMessage({ type: 'ok', text: `已保存 ${saved.length} 道题，可以在专项题库或下方列表中练习。` })
    onChanged()
    return true
  }

  async function remove(item: PracticeItem) {
    if (deleting || !window.confirm(`删除题目 #${item.id}？相关练习记录会保留，但题目将无法再练习。`)) return
    setDeleting(itemKey(item))
    const { error } = await deleteCustomItem(item.taskType, item.id)
    setDeleting(null)
    setMessage(error ? { type: 'error', text: error } : { type: 'ok', text: '题目已删除。' })
    if (!error) onChanged()
  }

  async function update(items: NewPracticeItem[]) {
    if (!userId || !editing || items.length !== 1) return false
    setMessage(null)
    const { error } = await updateCustomItem(editing.id, items[0], userId)
    if (error) { setMessage({ type: 'error', text: error }); return false }
    setEditing(null)
    setMessage({ type: 'ok', text: `题目 #${editing.id} 已更新，原练习记录保留。` })
    onChanged()
    return true
  }

  return <div className="space-y-6">
    <div className="pte-section-heading"><div><p className="pte-eyebrow">MY QUESTIONS</p><h2>上传题目</h2><p className="pte-muted">把自己整理的练习题加入题库，两个人都能看到和练习</p></div></div>
    {!userId && <div className="pte-notice" role="status">登录后才能上传或删除题目。</div>}
    {message && <div className="pte-notice" role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    <div className="pte-filter-tabs" aria-label="上传方式">
      <button type="button" aria-pressed={mode === 'form'} className={mode === 'form' ? 'active' : ''} onClick={() => setMode('form')}>表单录入</button>
      <button type="button" aria-pressed={mode === 'json'} className={mode === 'json' ? 'active' : ''} onClick={() => setMode('json')}>JSON 批量导入</button>
    </div>
    <section className="pte-upload-card">{mode === 'form' ? <CustomItemForm canSave={!!userId} onSave={save} /> : <JsonImport canSave={!!userId} onSave={save} />}</section>

    {editing && <section className="pte-upload-card" aria-labelledby="pte-edit-question-title">
      <div className="pte-section-heading compact"><div><p className="pte-eyebrow">EDIT QUESTION</p><h3 id="pte-edit-question-title">编辑题目 #{editing.id}</h3></div></div>
      <CustomItemForm key={itemKey(editing)} canSave={!!userId} initialItem={editing} onSave={update} onCancel={() => setEditing(null)} />
    </section>}

    <section>
      <div className="pte-section-heading compact"><div><h3>已上传的题目</h3><p className="pte-muted">{mine.length} 道</p></div></div>
      {!mine.length ? <div className="pte-empty"><FilePlus2 size={28} /><h3>还没有上传题目</h3><p>保存后会出现在这里，也会进入专项题库。</p></div>
        : <div className="pte-question-list">{mine.map((item) => {
          const key = itemKey(item)
          const info = infoByKey.get(key)
          const meta = TASK_TYPE_META[item.taskType]
          const canManage = Boolean(userId && info?.createdBy === userId)
          return <article className="pte-question-row" key={key}>
            <span className={`pte-task-code skill-${meta.skill}`}>{TASK_CODES[item.taskType]}</span>
            <div className="pte-question-copy">
              <div className="pte-question-meta"><span>#{item.id}</span><span>{info?.createdBy} 上传</span><span>{itemSourceLabel(item, true)}{item.provenance ? ` · ${item.provenance.sourceTitle}` : ''}</span>{info?.createdAt && <span>{new Date(info.createdAt).toLocaleDateString('zh-CN')}</span>}</div>
              <button className="pte-question-title" onClick={() => onPractice(item.taskType, item.id)}>{itemPreview(item)}</button>
              <p>{meta.shortLabel}</p>
            </div>
            <div className="pte-row-actions">
              <button className="pte-icon-button" title={canManage ? '编辑题目' : '只能编辑自己上传的题目'} aria-label={`编辑 ${item.id}`} disabled={!canManage} onClick={() => setEditing(item)}><Pencil size={17} /></button>
              <button className="pte-icon-button" title={canManage ? '删除题目' : '只能删除自己上传的题目'} aria-label={`删除 ${item.id}`} disabled={!canManage || deleting === key} onClick={() => void remove(item)}><Trash2 size={17} /></button>
              <button className="pte-icon-button start" title="开始练习" aria-label={`练习 ${item.id}`} onClick={() => onPractice(item.taskType, item.id)}><ArrowRight size={19} /></button>
            </div>
          </article>
        })}</div>}
    </section>
  </div>
}
