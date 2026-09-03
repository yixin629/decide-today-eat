import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { getTasks, SKILL_META } from '../lib/standards'
import { SKILLS, type PlannerConfig, type PracticeRow, type Skill, type StudyDay } from '../types'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function phaseFor(day: number, total: number) {
  const ratio = day / total
  if (ratio <= 0.28) return { label: '基础校准', factor: 0.9 }
  if (ratio <= 0.64) return { label: '强化提分', factor: 1.05 }
  if (ratio <= 0.88) return { label: '套题冲刺', factor: 1 }
  return { label: '考前稳态', factor: 0.72 }
}

function makeRows(dayNumber: number, taskId: string, count: number): PracticeRow[] {
  const extraCount = Math.max(1, Math.ceil(count * 0.25))
  return Array.from({ length: count + extraCount }, (_, index) => ({
    id: `${dayNumber}-${taskId}-${index + 1}`,
    category: index < count ? 'planned' : 'extra',
    questionId: '',
    starred: false,
    score: '',
    attempts: '',
    note: '',
  }))
}

export function generateStudyPlan(config: PlannerConfig): StudyDay[] {
  const start = parseISO(config.startDate)
  const test = parseISO(config.testDate)
  const totalDays = clamp(differenceInCalendarDays(test, start), 1, 180)
  const tasks = getTasks(config.testType)
  const gaps = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      Math.max(3, config.targetScores[skill] - config.currentScores[skill]),
    ])
  ) as Record<Skill, number>

  return Array.from({ length: totalDays }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1
    const phase = phaseFor(dayNumber, totalDays)
    const weekdayFactor = dayIndex % 7 === 6 ? 0.78 : 1
    const plannedMinutes = Math.max(
      25,
      Math.round(config.dailyMinutes * phase.factor * weekdayFactor)
    )
    const taskKinds = plannedMinutes <= 60 ? 5 : plannedMinutes <= 120 ? 7 : 9
    const ranked = tasks
      .map((task, index) => {
        const gapScore = Object.entries(task.skillWeights).reduce(
          (sum, [skill, weight]) => sum + gaps[skill as Skill] * (weight ?? 0),
          0
        )
        const rotation = ((dayIndex + index * 2) % 7) * 0.7
        const phaseBoost =
          phase.label === '基础校准' && task.minutesPerItem <= 4
            ? 6
            : phase.label === '套题冲刺' && task.minutesPerItem >= 7
              ? 8
              : 0
        return { task, score: gapScore * task.basePriority + rotation + phaseBoost }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, taskKinds)

    const totalScore = ranked.reduce((sum, item) => sum + item.score, 0)
    const plannedTasks = ranked
      .map(({ task, score }) => {
        const allocation = plannedMinutes * (score / totalScore)
        const cap = task.minutesPerItem <= 1 ? 20 : task.minutesPerItem <= 3 ? 10 : 3
        const plannedCount = clamp(Math.round(allocation / task.minutesPerItem), 1, cap)
        return {
          ...task,
          plannedCount,
          rows: makeRows(dayNumber, task.id, plannedCount),
        }
      })
      .sort((a, b) => SKILLS.indexOf(a.primarySkill) - SKILLS.indexOf(b.primarySkill))

    const focusSkill = [...SKILLS].sort((a, b) => gaps[b] - gaps[a])[dayIndex % 2]
    const date = addDays(start, dayIndex)
    const reviewHint = dayNumber % 7 === 0 ? '｜本周错题复盘' : ''

    return {
      date: format(date, 'yyyy-MM-dd'),
      dayNumber,
      phase: phase.label,
      focus: `${SKILL_META[focusSkill].label}优先${reviewHint}`,
      plannedMinutes,
      tasks: plannedTasks,
    }
  })
}
