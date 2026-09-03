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

export type DailyStudyMood = '' | 'great' | 'good' | 'normal' | 'tired' | 'stuck'

export interface DailySummary {
  actualMinutes: number | null
  mood: DailyStudyMood
  achievement: string
  difficulty: string
  nextFocus: string
}

export interface StudyDay {
  date: string
  dayNumber: number
  phase: string
  focus: string
  plannedMinutes: number
  hiddenTaskIds: string[]
  summary: DailySummary
  tasks: PlannedTask[]
}

export interface SavedPtePlan {
  version: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  config: PlannerConfig
  days: StudyDay[]
}
