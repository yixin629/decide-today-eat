'use client'

import { useState, useEffect } from 'react'
import { readSessionUser } from '@/lib/auth-session'

export function useAuth() {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loggedInUser = readSessionUser()

    if (loggedInUser) {
      setUser(loggedInUser)
    }

    setLoading(false)
  }, [])

  return { user, loading }
}
