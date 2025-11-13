import Link from 'next/link'

interface BackButtonProps {
  href?: string
  text?: string
  className?: string
}

export default function BackButton({
  href = '/',
  text = '返回首页',
  className = '',
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 hover:text-primary font-medium ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span>{text}</span>
    </Link>
  )
}
