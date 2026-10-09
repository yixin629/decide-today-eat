'use client'

import type { QuestionProvenance, QuestionSourceType } from '../../types'

export interface ProvenanceDraft {
  sourceType: QuestionSourceType
  sourceTitle: string
  sourceUrl: string
  rightsBasis: string
  commercialUseAllowed: boolean
}

export const EMPTY_PROVENANCE: ProvenanceDraft = {
  sourceType: 'original',
  sourceTitle: '',
  sourceUrl: '',
  rightsBasis: '',
  commercialUseAllowed: false,
}

export function provenanceDraft(value?: QuestionProvenance): ProvenanceDraft {
  return value ? {
    sourceType: value.sourceType,
    sourceTitle: value.sourceTitle,
    sourceUrl: value.sourceUrl ?? '',
    rightsBasis: value.rightsBasis,
    commercialUseAllowed: false,
  } : EMPTY_PROVENANCE
}

export function provenancePayload(value: ProvenanceDraft) {
  return {
    sourceType: value.sourceType,
    sourceTitle: value.sourceTitle.trim(),
    ...(value.sourceUrl.trim() ? { sourceUrl: value.sourceUrl.trim() } : {}),
    rightsBasis: value.rightsBasis.trim(),
    commercialUseAllowed: value.commercialUseAllowed,
  }
}

/** JSON 导入用的来源模板：不含商用确认，确认只能在页面上勾选。 */
export function provenanceTemplate(value: ProvenanceDraft) {
  return {
    sourceType: value.sourceType,
    sourceTitle: value.sourceTitle.trim(),
    ...(value.sourceUrl.trim() ? { sourceUrl: value.sourceUrl.trim() } : {}),
    rightsBasis: value.rightsBasis.trim(),
  }
}

export default function ProvenanceFields({ value, onChange, mode = 'form' }: { value: ProvenanceDraft; onChange: (value: ProvenanceDraft) => void; mode?: 'form' | 'json' }) {
  const set = <K extends keyof ProvenanceDraft>(key: K, next: ProvenanceDraft[K]) => onChange({ ...value, [key]: next })

  return <fieldset className="pte-rights-fields">
    <legend>{mode === 'json' ? '来源模板与商业授权确认' : '内容来源与商业授权'}</legend>
    <p className="pte-small-note">公开可访问不代表可商用。请保存真实来源和权利依据；不得录入考场回忆题或未经许可复制的第三方付费题库。{mode === 'json' && ' JSON 中每道题都必须带自己的 provenance；下面的字段可作为模板写入缺少来源的题目。'}</p>
    <div className="pte-rights-grid">
      <label className="pte-upload-field"><span>来源类型</span><select value={value.sourceType} onChange={(event) => set('sourceType', event.target.value as QuestionSourceType)}><option value="original">自行原创</option><option value="licensed">已取得商业授权</option><option value="public-domain">公共领域或开放许可</option><option value="user-provided">用户自有内容</option></select></label>
      <label className="pte-upload-field"><span>来源名称</span><input value={value.sourceTitle} maxLength={200} placeholder="例如：内部原创题库 2026-10" onChange={(event) => set('sourceTitle', event.target.value)} /></label>
      <label className="pte-upload-field"><span>来源网址（可选）</span><input type="url" value={value.sourceUrl} placeholder="https://..." onChange={(event) => set('sourceUrl', event.target.value)} /></label>
      <label className="pte-upload-field"><span>授权依据</span><textarea rows={3} maxLength={1000} value={value.rightsBasis} placeholder="说明原创人、许可证名称、合同编号或用户权利声明" onChange={(event) => set('rightsBasis', event.target.value)} /></label>
    </div>
    <label className="pte-rights-confirm"><input type="checkbox" checked={value.commercialUseAllowed} onChange={(event) => set('commercialUseAllowed', event.target.checked)} /><span>{mode === 'json' ? '我确认本次导入的所有题目均按各自 provenance 记录的来源取得授权，有权用于本平台的商业练习服务，并愿意保留相应证明。' : '我确认有权将这些内容用于本平台的商业练习服务，并愿意保留相应证明。'}</span></label>
  </fieldset>
}
