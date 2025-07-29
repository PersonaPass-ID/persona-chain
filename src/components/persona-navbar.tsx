'use client'

import Link from 'next/link'
import { 
  Navbar, 
  NavbarSection, 
  NavbarItem, 
  NavbarSpacer, 
  NavbarDivider,
  NavbarLabel 
} from '@/components/ui/navbar'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function PersonaNavbar() {
  return (
    <Navbar className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-3">
        <Avatar 
          initials="P" 
          className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold"
        />
        <NavbarLabel className="text-xl font-bold">Persona</NavbarLabel>
      </Link>

      <NavbarDivider className="max-lg:hidden" />

      {/* Main Navigation */}
      <NavbarSection className="max-lg:hidden">
        <NavbarItem href="/" current>
          Home
        </NavbarItem>
        <NavbarItem href="/about">
          About
        </NavbarItem>
        <NavbarItem href="/technology">
          Technology
        </NavbarItem>
        <NavbarItem href="/developers">
          Developers
        </NavbarItem>
        <NavbarItem href="/governance">
          Governance
        </NavbarItem>
      </NavbarSection>

      <NavbarSpacer />

      {/* Right Side Actions */}
      <NavbarSection>
        <Button variant="outline" size="sm">
          Connect Wallet
        </Button>
        <Button size="sm">
          Get Started
        </Button>
      </NavbarSection>
    </Navbar>
  )
}