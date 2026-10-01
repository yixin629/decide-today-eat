'use client'

import { TASK_TYPE_META } from '../lib/taskTypes'
import { SKILL_NAMES, STUDY_SKILLS, TASK_CODES } from '../lib/study'
import { TASK_TYPES, type PteSkill, type TaskType } from '../types'

export type SkillFilter = PteSkill | 'all'

/**
 * 题型选择：第一行是技能分组，第二行直接平铺该技能下的题型芯片，
 * 替代原来需要展开下拉框才能看到题型的交互。
 * allowAll=false 时用于必须选定具体题型的场景（如上传题目）。
 */
export default function TaskTypePicker({ skill, task, onChange, counts, types = TASK_TYPES, allowAll = true, label = '题型' }: {
  skill: SkillFilter
  task: TaskType | 'all'
  onChange: (next: { skill: SkillFilter; task: TaskType | 'all' }) => void
  counts?: Partial<Record<TaskType, number>>
  types?: readonly TaskType[]
  allowAll?: boolean
  label?: string
}) {
  const skills = STUDY_SKILLS.filter((s) => types.some((t) => TASK_TYPE_META[t].skill === s))
  const visibleTypes = types.filter((t) => skill === 'all' || TASK_TYPE_META[t].skill === skill)
  const total = (list: readonly TaskType[]) => list.reduce((sum, t) => sum + (counts?.[t] ?? 0), 0)

  function pickSkill(next: SkillFilter) {
    if (allowAll) onChange({ skill: next, task: 'all' })
    else onChange({ skill: next, task: types.find((t) => TASK_TYPE_META[t].skill === next) ?? task })
  }

  return <div className="pte-task-picker" role="group" aria-label={label}>
    <div className="pte-skill-tabs" role="tablist" aria-label={`${label}：技能`}>
      {allowAll && <button type="button" role="tab" aria-selected={skill === 'all'} className={skill === 'all' ? 'active' : ''} onClick={() => pickSkill('all')}>全部{counts && <small>{total(types)}</small>}</button>}
      {skills.map((s) => <button key={s} type="button" role="tab" aria-selected={skill === s} className={`skill-tab-${s} ${skill === s ? 'active' : ''}`} onClick={() => pickSkill(s)}>
        {SKILL_NAMES[s]}{counts && <small>{total(types.filter((t) => TASK_TYPE_META[t].skill === s))}</small>}
      </button>)}
    </div>
    <div className="pte-type-chips">
      {allowAll && skill !== 'all' && <button type="button" aria-pressed={task === 'all'} className={task === 'all' ? 'active' : ''} onClick={() => onChange({ skill, task: 'all' })}>全部{SKILL_NAMES[skill]}</button>}
      {visibleTypes.map((t) => {
        const meta = TASK_TYPE_META[t]
        return <button key={t} type="button" aria-pressed={task === t} title={meta.label} className={task === t ? 'active' : ''} onClick={() => onChange({ skill: allowAll ? skill : meta.skill, task: t })}>
          <span className={`pte-chip-code skill-${meta.skill}`}>{TASK_CODES[t]}</span>{meta.shortLabel}{counts && <small>{counts[t] ?? 0}</small>}
        </button>
      })}
    </div>
  </div>
}
