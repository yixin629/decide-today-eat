'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth(requireLogin = true) {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check both keys for compatibility
    const loggedInUser = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser')

    if (loggedInUser) {
      setUser(loggedInUser)
      // Standardize: ensure both keys are set for other legacy components
      if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', loggedInUser)
      }
      if (!localStorage.getItem('loggedInUser')) {
        localStorage.setItem('loggedInUser', loggedInUser)
      }
    } else if (requireLogin) {
      // Optional: Redirect if strictly required (can be disabled for public pages)
      // router.push('/login')
    }

    setLoading(false)
  }, [requireLogin, router])

  return { user, loading }
}
