import type { AnswerPayload, PracticeItem } from '../../types'

export default function AnswerReview({ item, answer }: { item: PracticeItem; answer: AnswerPayload }) {
  let reference = ''
  if ('correctIndex' in item) reference = item.options[item.correctIndex]
  else if ('correctIndexes' in item) reference = item.correctIndexes.map((index) => item.options[index]).join('\n')
  else if ('correctAnswers' in item) reference = item.correctAnswers.map((word, i) => `${i + 1}. ${word}`).join('   ')
  else if ('correctOrder' in item) reference = item.correctOrder.map((index, i) => `${i + 1}. ${item.paragraphs[index]}`).join('\n\n')
  else if ('sentence' in item) reference = item.sentence
  else if ('incorrectWordIndexes' in item) reference = item.incorrectWordIndexes.map((index) => `${index + 1}. ${item.displayedWords[index]}`).join('   ')
  else if ('acceptableAnswers' in item) reference = item.acceptableAnswers.join(' / ')
  else if ('referenceDescription' in item) reference = item.referenceDescription
  else if ('transcript' in item) reference = item.transcript
  else if ('text' in item) reference = item.text
  else if ('sourceText' in item) reference = item.sourceText ?? ''

  let response = ''
  if ('text' in answer) response = answer.text
  else if ('recognizedTranscript' in answer) response = answer.recognizedTranscript ?? '未获得转写文本，请回放录音复习。'
  else if ('selectedIndex' in answer && 'options' in item) response = answer.selectedIndex === null ? '' : item.options[answer.selectedIndex]
  else if ('selectedIndexes' in answer && 'options' in item) response = answer.selectedIndexes.map((i) => item.options[i]).join('\n')
  else if ('answers' in answer) response = answer.answers.map((word, i) => `${i + 1}. ${word || '未填写'}`).join('   ')
  else if ('order' in answer && 'paragraphs' in item) response = answer.order.map((i, n) => `${n + 1}. ${item.paragraphs[i]}`).join('\n\n')
  else if ('selectedWordIndexes' in answer && 'displayedWords' in item) response = answer.selectedWordIndexes.map((i) => `${i + 1}. ${item.displayedWords[i]}`).join('   ')

  return <section className="pte-answer-review"><h3>作答对照</h3><dl><div><dt>我的作答</dt><dd>{response || '未作答'}</dd></div>{reference && <div><dt>{item.taskType.startsWith('speaking-') || item.taskType.includes('summarize') ? '参考内容' : '参考答案'}</dt><dd>{reference}</dd></div>}</dl></section>
}
