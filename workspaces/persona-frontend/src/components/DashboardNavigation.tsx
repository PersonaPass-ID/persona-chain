'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Key, 
  Shield, 
  FileText, 
  Share2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Zap,
  QrCode,
  Plus
} from 'lucide-react'

export function DashboardNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // Clear stored credentials and redirect to home
    if (typeof window !== 'undefined') {
      localStorage.removeItem('persona_vc')
      localStorage.removeItem('persona_did') 
      localStorage.removeItem('persona_profile')
    }
    router.push('/')
  }

  const navItems = [
    {
      name: 'My Identity',
      href: '/dashboard',
      icon: User,
      description: 'View your DID and profile'
    },
    {
      name: 'Credentials',
      href: '/dashboard/credentials',
      icon: FileText,
      description: 'Manage verifiable credentials'
    },
    {
      name: 'Create VC',
      href: '/dashboard/create-credential',
      icon: Plus,
      description: 'Create new verifiable credential'
    },
    {
      name: 'ZK Proofs',
      href: '/dashboard/zk-proofs',
      icon: Shield,
      description: 'Generate zero-knowledge proofs'
    },
    {
      name: 'Share & Verify',
      href: '/dashboard/share',
      icon: Share2,
      description: 'Share proofs with others'
    },
    {
      name: 'QR Codes',
      href: '/dashboard/qr-codes',
      icon: QrCode,
      description: 'Generate QR codes for sharing'
    },
    {
      name: 'Recovery',
      href: '/dashboard/recovery',
      icon: Key,
      description: 'Backup and recovery options'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Account and privacy settings'
    }
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Persona
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Dashboard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.slice(0, 6).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 whitespace-nowrap"
              >
                <span>{item.name}</span>
                
                {/* Tooltip */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {item.description}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </Link>
            ))}

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span>Profile</span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-2">
                  {navItems.slice(6).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Sign Out</div>
                      <div className="text-xs text-red-500">Return to landing page</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </Link>
            ))}
            <hr className="my-2 border-gray-200" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <div>
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-red-500">Return to landing page</div>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}