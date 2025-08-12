'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const Navbar = forwardRef<
  HTMLElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => (
  <nav
    ref={ref}
    className={cn(
      'flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50',
      className
    )}
  >
    {children}
  </nav>
))
Navbar.displayName = 'Navbar'

const NavbarSection = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center space-x-6', className)}
  >
    {children}
  </div>
))
NavbarSection.displayName = 'NavbarSection'

const NavbarItem = forwardRef<
  HTMLAnchorElement,
  {
    href?: string
    current?: boolean
    children: ReactNode
    className?: string
    'aria-label'?: string
  }
>(({ href, current, children, className, ...props }, ref) => {
  const baseClasses = cn(
    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
    current
      ? 'text-primary bg-secondary/50'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30',
    className
  )

  if (href) {
    return (
      <Link
        ref={ref}
        href={href}
        className={baseClasses}
        {...props}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      ref={ref as any}
      className={baseClasses}
      {...props}
    >
      {children}
    </button>
  )
})
NavbarItem.displayName = 'NavbarItem'

const NavbarSpacer = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1', className)}
  />
))
NavbarSpacer.displayName = 'NavbarSpacer'

const NavbarDivider = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div
    ref={ref}
    className={cn('w-px h-6 bg-border', className)}
  />
))
NavbarDivider.displayName = 'NavbarDivider'

const NavbarLabel = forwardRef<
  HTMLSpanElement,
  { children: ReactNode; className?: string }
>(({ children, className }, ref) => (
  <span
    ref={ref}
    className={cn('font-medium', className)}
  >
    {children}
  </span>
))
NavbarLabel.displayName = 'NavbarLabel'

export {
  Navbar,
  NavbarSection,
  NavbarItem,
  NavbarSpacer,
  NavbarDivider,
  NavbarLabel,
}