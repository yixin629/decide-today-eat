'use client'

import type { AnswerPayload, PracticeItem } from '../../types'
import { FillBlanksDragInput, FillBlanksDropdownInput, McqMultipleInput, McqSingleInput, ReorderInput } from '../inputs/ReadingInputs'
import { HighlightIncorrectWordsInput, HighlightSummaryInput, ListeningFillBlanksInput, ListeningMcqMultipleInput, ListeningMcqSingleInput, ListeningSummarizeInput, SelectMissingWordInput, WriteFromDictationInput } from '../inputs/ListeningInputs'
import { AnswerShortQuestionInput, DescribeImageInput, ReadAloudInput, RepeatSentenceInput, RespondToSituationInput, RetellLectureInput, SummarizeGroupDiscussionInput } from '../inputs/SpeakingInput'
import { WritingInput } from '../inputs/WritingInput'

export default function PracticeInput({ item, onChange }: { item: PracticeItem; onChange: (answer: AnswerPayload) => void }) {
  switch (item.taskType) {
    case 'reading-mcq-single': return <McqSingleInput item={item} onChange={(selectedIndex) => onChange({ taskType: item.taskType, selectedIndex })} />
    case 'reading-mcq-multiple': return <McqMultipleInput item={item} onChange={(selectedIndexes) => onChange({ taskType: item.taskType, selectedIndexes })} />
    case 'reading-reorder': return <ReorderInput item={item} onChange={(order) => onChange({ taskType: item.taskType, order })} />
    case 'reading-fill-blanks-drag': return <FillBlanksDragInput item={item} onChange={(answers) => onChange({ taskType: item.taskType, answers })} />
    case 'reading-fill-blanks-dropdown': return <FillBlanksDropdownInput item={item} onChange={(answers) => onChange({ taskType: item.taskType, answers })} />
    case 'listening-fill-blanks-typed': return <ListeningFillBlanksInput item={item} onChange={(answers) => onChange({ taskType: item.taskType, answers })} />
    case 'listening-highlight-summary': return <HighlightSummaryInput item={item} onChange={(selectedIndex) => onChange({ taskType: item.taskType, selectedIndex })} />
    case 'listening-mcq-single': return <ListeningMcqSingleInput item={item} onChange={(selectedIndex) => onChange({ taskType: item.taskType, selectedIndex })} />
    case 'listening-mcq-multiple': return <ListeningMcqMultipleInput item={item} onChange={(selectedIndexes) => onChange({ taskType: item.taskType, selectedIndexes })} />
    case 'listening-summarize-spoken-text': return <ListeningSummarizeInput item={item} onChange={(text) => onChange({ taskType: item.taskType, text, secondsUsed: 0 })} />
    case 'listening-select-missing-word': return <SelectMissingWordInput item={item} onChange={(selectedIndex) => onChange({ taskType: item.taskType, selectedIndex })} />
    case 'listening-highlight-incorrect-words': return <HighlightIncorrectWordsInput item={item} onChange={(selectedWordIndexes) => onChange({ taskType: item.taskType, selectedWordIndexes })} />
    case 'listening-write-from-dictation': return <WriteFromDictationInput item={item} onChange={(text) => onChange({ taskType: item.taskType, text })} />
    case 'writing-summarize-text':
    case 'writing-essay': return <WritingInput item={item} onChange={(text) => onChange({ taskType: item.taskType, text, secondsUsed: 0 })} />
    case 'speaking-read-aloud': return <ReadAloudInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-repeat-sentence': return <RepeatSentenceInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-describe-image': return <DescribeImageInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-retell-lecture': return <RetellLectureInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-answer-short-question': return <AnswerShortQuestionInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-summarize-group-discussion': return <SummarizeGroupDiscussionInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
    case 'speaking-respond-to-situation': return <RespondToSituationInput item={item} onChange={(result) => onChange({ taskType: item.taskType, ...result })} />
  }
}
