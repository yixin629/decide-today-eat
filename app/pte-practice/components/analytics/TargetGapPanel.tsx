import Link from 'next/link'
import type { SkillGapEntry } from '../../lib/analyticsEngine'
import { SKILL_NAMES } from '../../lib/study'

export default function TargetGapPanel({ gaps, planName }: { gaps: SkillGapEntry[] | null; planName: string | null }) {
  return <section className="space-y-3">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-sm font-semibold">备考目标与近期练习</h3>
      {planName && <span className="text-xs text-gray-500">来自计划「{planName}」</span>}
    </div>
    {!gaps ? <p className="text-sm text-gray-500">还没有备考目标。<Link href="/pte-plan" className="text-primary underline">前往备考计划</Link></p> : <>
      <p className="text-xs text-gray-500">考试目标为 10–90 分制；练习百分比仅统计已评估的客观维度，两者不能换算或相减。</p>
      <ul className="divide-y">{gaps.map((gap) => <li key={gap.skill} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <span className="font-medium">{SKILL_NAMES[gap.skill]}</span>
        <span>考试目标 {gap.targetScore} 分</span>
        <span className="text-gray-500">{gap.currentPct === null ? '暂无客观评分样本' : `客观维度 ${gap.currentPct}% · ${gap.sampleCount} 个样本`}</span>
      </li>)}</ul>
    </>}
  </section>
}
