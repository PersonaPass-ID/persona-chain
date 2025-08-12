'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import WalletAuthButton from './WalletAuthButton'

const navigation = {
  solutions: [
    { name: 'Age Verification', href: '/solutions/age-verification', description: 'Verify age for compliance' },
    { name: 'Financial KYC', href: '/solutions/financial-kyc', description: 'Banking & finance onboarding' },
    { name: 'Professional Credentials', href: '/solutions/professional', description: 'License & certification verification' },
    { name: 'Identity Confirmation', href: '/solutions/identity', description: 'Basic identity verification' },
    { name: 'Address Verification', href: '/solutions/address', description: 'Residence confirmation' },
    { name: 'Income Verification', href: '/solutions/income', description: 'Financial status confirmation' },
  ],
  business: [
    { name: 'Enterprise Solutions', href: '/business/enterprise', description: 'Large-scale verification systems' },
    { name: 'API Integration', href: '/business/api', description: 'Developer-friendly integration' },
    { name: 'Compliance Dashboard', href: '/business/compliance', description: 'Monitor & manage compliance' },
    { name: 'Case Studies', href: '/business/case-studies', description: 'Success stories from customers' },
  ],
  developers: [
    { name: 'API Documentation', href: '/developers/docs', description: 'Complete API reference' },
    { name: 'SDKs & Libraries', href: '/developers/sdks', description: 'Pre-built integrations' },
    { name: 'Sandbox', href: '/developers/sandbox', description: 'Test environment' },
    { name: 'Code Examples', href: '/developers/examples', description: 'Implementation guides' },
  ],
  resources: [
    { name: 'Blog', href: '/blog', description: 'Latest insights & updates' },
    { name: 'Security Docs', href: '/resources/security', description: 'Security & privacy details' },
    { name: 'Help Center', href: '/help', description: 'Support & tutorials' },
    { name: 'Status Page', href: '/status', description: 'System status & uptime' },
  ]
}

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Persona</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Persona</span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {/* Solutions Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              type="button"
              className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Solutions
              <ChevronDown className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
            </button>

            {activeDropdown === 'solutions' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -left-8 top-full z-10 pt-3 w-screen max-w-md"
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4">
                    {navigation.solutions.map((item) => (
                      <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                        <div className="flex-auto">
                          <a href={item.href} className="block font-semibold text-gray-900">
                            {item.name}
                            <span className="absolute inset-0" />
                          </a>
                          <p className="mt-1 text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Business Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('business')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              type="button"
              className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              For Business
              <ChevronDown className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
            </button>

            {activeDropdown === 'business' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -left-8 top-full z-10 pt-3 w-screen max-w-md"
                onMouseEnter={() => setActiveDropdown('business')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4">
                    {navigation.business.map((item) => (
                      <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                        <div className="flex-auto">
                          <a href={item.href} className="block font-semibold text-gray-900">
                            {item.name}
                            <span className="absolute inset-0" />
                          </a>
                          <p className="mt-1 text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Developers Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('developers')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              type="button"
              className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Developers
              <ChevronDown className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
            </button>

            {activeDropdown === 'developers' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -left-8 top-full z-10 pt-3 w-screen max-w-md"
                onMouseEnter={() => setActiveDropdown('developers')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4">
                    {navigation.developers.map((item) => (
                      <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                        <div className="flex-auto">
                          <a href={item.href} className="block font-semibold text-gray-900">
                            {item.name}
                            <span className="absolute inset-0" />
                          </a>
                          <p className="mt-1 text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Simple links */}
          <a href="/pricing" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
            Pricing
          </a>

          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('resources')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              type="button"
              className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Resources
              <ChevronDown className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
            </button>

            {activeDropdown === 'resources' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -left-8 top-full z-10 pt-3 w-screen max-w-md"
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4">
                    {navigation.resources.map((item) => (
                      <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                        <div className="flex-auto">
                          <a href={item.href} className="block font-semibold text-gray-900">
                            {item.name}
                            <span className="absolute inset-0" />
                          </a>
                          <p className="mt-1 text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          <WalletAuthButton size="sm" variant="outline" />
          <a
            href="/get-started"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10" onClick={() => setMobileMenuOpen(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Persona</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Persona</span>
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  <a
                    href="/solutions"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Solutions
                  </a>
                  <a
                    href="/business"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    For Business
                  </a>
                  <a
                    href="/developers"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Developers
                  </a>
                  <a
                    href="/pricing"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Pricing
                  </a>
                  <a
                    href="/resources"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Resources
                  </a>
                </div>
                <div className="py-6 space-y-4">
                  <WalletAuthButton className="w-full justify-center" variant="outline" />
                  <a
                    href="/get-started"
                    className="block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </header>
  )
}