'use client'

import { createContext, type RefObject } from 'react'

// Submission waits for MediaRecorder's final audio chunk before reading the answer.
export const RecordingContext = createContext<RefObject<(() => Promise<void>) | null> | null>(null)
