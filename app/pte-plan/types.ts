export const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const

export type Skill = (typeof SKILLS)[number]
export type TestType = 'academic' | 'core'

export interface SkillScores {
  listening: number
  reading: number
  writing: number
  speaking: number
}

export interface ScorePreset {
  id: string
  group: 'australia' | 'canada' | 'uk' | 'new-zealand' | 'university'
  country: string
  label: string
  testType: TestType
  testLabel: string
  requirement: string
  officialScores: SkillScores
  recommendedScores: SkillScores
  officialScoreMode: 'components' | 'overall' | 'guidance'
  note: string
  sourceLabel: string
  sourceUrl: string
  checkedAt: string
}

export interface TaskProfile {
  id: string
  label: string
  shortLabel: string
  primarySkill: Skill
  skillWeights: Partial<Record<Skill, number>>
  minutesPerItem: number
  basePriority: number
  standard: string
}

export interface PlannerConfig {
  presetId: string
  testType: TestType
  startDate: string
  testDate: string
  dailyMinutes: number
  currentScores: SkillScores
  targetScores: SkillScores
}

export interface PracticeRow {
  id: string
  category: 'planned' | 'extra'
  questionId: string
  starred: boolean
  score: string
  attempts: string
  note: string
}

export interface PlannedTask extends TaskProfile {
  plannedCount: number
  rows: PracticeRow[]
}

export interface StudyDay {
  date: string
  dayNumber: number
  phase: string
  focus: string
  plannedMinutes: number
  tasks: PlannedTask[]
}

export interface SavedPtePlan {
  version: 1
  createdAt: string
  config: PlannerConfig
  days: StudyDay[]
}

export const PTE_STORAGE_KEY = 'our-little-world-pte-plan-v1'
