import type { AnswerPayload, PracticeItem, TaskType } from '../types'

export function emptyAnswerFor(taskType: TaskType, item?: PracticeItem): AnswerPayload {
  switch (taskType) {
    case 'reading-mcq-single':
    case 'listening-highlight-summary':
    case 'listening-mcq-single':
    case 'listening-select-missing-word': return { taskType, selectedIndex: null }
    case 'reading-mcq-multiple':
    case 'listening-mcq-multiple': return { taskType, selectedIndexes: [] }
    case 'reading-reorder': return { taskType, order: item?.taskType === 'reading-reorder' ? item.paragraphs.map((_, index) => index) : [] }
    case 'reading-fill-blanks-drag':
    case 'reading-fill-blanks-dropdown':
    case 'listening-fill-blanks-typed': return { taskType, answers: [] }
    case 'listening-highlight-incorrect-words': return { taskType, selectedWordIndexes: [] }
    case 'listening-write-from-dictation': return { taskType, text: '' }
    case 'writing-summarize-text':
    case 'writing-essay':
    case 'listening-summarize-spoken-text': return { taskType, text: '', secondsUsed: 0 }
    case 'speaking-read-aloud':
    case 'speaking-repeat-sentence':
    case 'speaking-describe-image':
    case 'speaking-retell-lecture':
    case 'speaking-answer-short-question':
    case 'speaking-summarize-group-discussion':
    case 'speaking-respond-to-situation': return { taskType, recordingSeconds: 0, recognizedTranscript: null, audioBlob: null }
  }
}
