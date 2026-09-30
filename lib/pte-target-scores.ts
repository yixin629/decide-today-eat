import { supabase } from './supabase'

/**
 * 只读、跨功能共享的"PTE 目标分数"读取。
 *
 * `/pte-plan` 和 `/pte-practice` 都需要知道用户最近一次设置的目标分数
 * （前者用来生成备考计划，后者用来在学习分析里算"目标达成度差距"）。
 * 按 AGENTS.md 的目录边界规则，一个功能目录不能直接依赖另一个功能目录的
 * 内部文件（比如 `/pte-practice` 直接 import `app/pte-plan/lib/plan-repository`），
 * 所以把这一小段"读最近一份计划的目标分数"单独提到共享 lib 里，两个功能
 * 都从这里读，谁也不依赖谁的内部实现。
 *
 * 这里只读 `config` 里的 `targetScores` 字段，不関心 `/pte-plan` 的其余
 * 数据结构（`days`、`name` 等），也不做任何写入，避免和 `/pte-plan` 自己的
 * `plan-repository.ts` 产生职责重叠或双向耦合。
 */

export interface PteTargetScores {
  listening: number
  reading: number
  writing: number
  speaking: number
}

export interface LatestPlanTarget {
  name: string
  targetScores: PteTargetScores
}

interface LatestPlanRow {
  name: string
  config: { targetScores?: PteTargetScores } | null
  updated_at: string
}

export async function getLatestPlanTarget(userId: string): Promise<LatestPlanTarget | null> {
  const { data, error } = await supabase
    .from('pte_plans')
    .select('name,config,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const row = data as LatestPlanRow
  const targetScores = row.config?.targetScores
  if (!targetScores) return null
  return { name: row.name, targetScores }
}
