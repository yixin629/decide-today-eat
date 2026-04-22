'use client'

import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-6xl mb-4 select-none" aria-hidden>
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {actionLabel && onAction && (
            <button onClick={onAction} className="btn-primary">
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button onClick={onSecondary} className="btn-secondary">
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
