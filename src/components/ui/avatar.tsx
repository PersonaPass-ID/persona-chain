'use client'

import Image from 'next/image'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  className?: string
  square?: boolean
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = '', initials, className, square = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-8 w-8 shrink-0 overflow-hidden bg-muted',
          square ? 'rounded-md' : 'rounded-full',
          className
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={32}
            height={32}
            className="aspect-square h-full w-full object-cover"
          />
        ) : initials ? (
          <span className="flex h-full w-full items-center justify-center text-sm font-medium">
            {initials}
          </span>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }