const SESSION_KEYS = ['loggedInUser', 'currentUser'] as const

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function readSessionUser(): string | null {
  if (!canUseStorage()) return null

  const user = SESSION_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ?? null

  if (user) {
    for (const key of SESSION_KEYS) {
      if (localStorage.getItem(key) !== user) {
        localStorage.setItem(key, user)
      }
    }
  }

  return user
}

export function writeSessionUser(user: string) {
  if (!canUseStorage()) return

  for (const key of SESSION_KEYS) {
    localStorage.setItem(key, user)
  }
}

export function clearSessionUser() {
  if (!canUseStorage()) return

  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key)
  }
}
