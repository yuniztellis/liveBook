'use client'

import { Loader2 } from 'lucide-react'

type LoadingOverlayProps = {
  title?: string
}

const LoadingOverlay = ({ title = 'A sintetizar o livro...' }: LoadingOverlayProps) => {
  return (
    <div className="loading-wrapper" role="status" aria-live="polite" aria-label={title}>
      <div className="loading-shadow-wrapper bg-white">
        <div className="loading-shadow">
          <Loader2 className="loading-animation w-10 h-10 text-[#663820]" />
          <p className="loading-title">{title}</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
