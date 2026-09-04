import { supabase } from '@/lib/supabase'
import type { SavedPteTemplate } from './templates'

interface PteTemplateRow {
  id: string
  user_id: string
  task_types: string[]
  badge: string
  title: string
  subtitle: string
  tips: string[]
  lines: string[]
  created_at: string
  updated_at: string
}

function rowToTemplate(row: PteTemplateRow): SavedPteTemplate {
  return {
    id: row.id,
    taskTypes: row.task_types,
    badge: row.badge,
    title: row.title,
    subtitle: row.subtitle,
    tips: row.tips,
    lines: row.lines,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadCustomTemplates(userId: string) {
  const { data, error } = await supabase
    .from('pte_templates')
    .select('id,user_id,task_types,badge,title,subtitle,tips,lines,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as PteTemplateRow[]).map(rowToTemplate)
}

export async function saveCustomTemplate(userId: string, template: SavedPteTemplate) {
  const { data, error } = await supabase
    .from('pte_templates')
    .upsert(
      {
        id: template.id,
        user_id: userId,
        task_types: template.taskTypes,
        badge: template.badge,
        title: template.title,
        subtitle: template.subtitle,
        tips: template.tips,
        lines: template.lines,
        created_at: template.createdAt,
        updated_at: template.updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('id,user_id,task_types,badge,title,subtitle,tips,lines,created_at,updated_at')
    .single()

  if (error) throw error
  return rowToTemplate(data as PteTemplateRow)
}

export async function deleteCustomTemplate(userId: string, templateId: string) {
  const { error } = await supabase
    .from('pte_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId)

  if (error) throw error
}
