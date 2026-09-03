import { supabase } from '@/lib/supabase'
import type { PlannerConfig, SavedPtePlan, StudyDay } from '../types'

interface PtePlanRow {
  id: string
  user_id: string
  name: string
  config: PlannerConfig
  days: StudyDay[]
  created_at: string
  updated_at: string
}

function rowToPlan(row: PtePlanRow): SavedPtePlan {
  return {
    version: 1,
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: row.config,
    days: row.days,
  }
}

export async function loadCloudPlans(userId: string) {
  const { data, error } = await supabase
    .from('pte_plans')
    .select('id,user_id,name,config,days,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as PtePlanRow[]).map(rowToPlan)
}

export async function saveCloudPlans(userId: string, plans: SavedPtePlan[]) {
  if (plans.length === 0) return

  const { error } = await supabase.from('pte_plans').upsert(
    plans.map((plan) => ({
      id: plan.id,
      user_id: userId,
      name: plan.name.trim() || '未命名计划',
      config: plan.config,
      days: plan.days,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    })),
    { onConflict: 'id' }
  )

  if (error) throw error
}

export async function deleteCloudPlan(userId: string, planId: string) {
  const { error } = await supabase
    .from('pte_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId)

  if (error) throw error
}
