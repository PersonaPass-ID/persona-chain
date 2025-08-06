'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Users,
  Lock,
  Sparkles,
  ChevronRight,
  Key,
  FileCheck,
  Eye,
  Fingerprint,
  Wallet,
  Database,
  Network,
  Cpu,
  Building2,
  GraduationCap,
  Briefcase,
  Heart,
  Car,
  Home,
  CreditCard
} from 'lucide-react'

// Core identity capabilities
const IDENTITY_FEATURES = [
  {
    icon: Key,
    title: 'Decentralized Identity (DID)',
    description: 'Create your sovereign digital identity on PersonaChain blockchain',
    stat: 'Self-sovereign'
  },
  {
    icon: FileCheck,
    title: 'Verifiable Credentials (VCs)',
    description: 'Issue and manage tamper-proof digital credentials for anything',
    stat: 'Blockchain-verified'
  },
  {
    icon: Eye,
    title: 'Zero-Knowledge Proofs',
    description: 'Prove facts about yourself without revealing personal data',
    stat: 'Privacy-first'
  },
  {
    icon: Shield,
    title: 'Multi-Layer Security',
    description: 'Enterprise-grade security with wallet-based authentication',
    stat: 'Bank-level security'
  }
]

// Real-world use cases across life domains
const LIFE_DOMAINS = [
  {
    icon: GraduationCap,
    title: 'Education & Skills',
    description: 'Degrees, certifications, achievements, course completions',
    examples: ['University Degree', 'Professional License', 'Online Course Certificate']
  },
  {
    icon: Briefcase,
    title: 'Professional Identity',
    description: 'Work history, skills verification, professional reputation',
    examples: ['Employment History', 'GitHub Profile', 'LinkedIn Verification']
  },
  {
    icon: Heart,
    title: 'Health & Medical',
    description: 'Medical records, vaccinations, health insurance, fitness data',
    examples: ['Vaccination Records', 'Medical History', 'Insurance Coverage']
  },
  {
    icon: Car,
    title: 'Licenses & Permits',
    description: 'Driver\'s license, professional permits, legal certifications',
    examples: ['Driver License', 'Professional Permit', 'Legal Certification']
  },
  {
    icon: Home,
    title: 'Personal Life',
    description: 'Age verification, address proof, relationship status, family',
    examples: ['Age Verification', 'Address Proof', 'Family Status']
  },
  {
    icon: CreditCard,
    title: 'Financial Identity',
    description: 'Credit score, income verification, banking, investment history',
    examples: ['Credit Score', 'Income Verification', 'Banking History']
  }
]

// User testimonials for identity platform
const TESTIMONIALS = [
  {
    quote: "PersonaPass gave me complete control over my digital identity. I can prove my credentials without sharing sensitive data.",
    author: "Alex Thompson",
    role: "Software Engineer",
    rating: 5
  },
  {
    quote: "As a freelancer, having verifiable credentials on blockchain helps me stand out. Clients trust my verified skills.",
    author: "Maria Garcia",
    role: "UX Designer & Freelancer",
    rating: 5
  },
  {
    quote: "The zero-knowledge proofs are amazing! I can verify my degree without revealing personal details to everyone.",
    author: "Dr. James Wilson",
    role: "Medical Professional",
    rating: 5
  }
]

export default function LandingPage() {
  const [showVideo, setShowVideo] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 text-white">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-2">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-sm font-medium">
            🚀 Now Live: Create your decentralized identity on PersonaChain! 
            <Link href="/onboard" className="underline ml-2">
              Get Started →
            </Link>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
              ⛓️ Powered by PersonaChain Blockchain
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent leading-tight">
              Your Complete Digital Identity Platform
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Create verifiable credentials for every aspect of your life. Own your identity with decentralized IDs, 
              zero-knowledge proofs, and blockchain security. No middlemen, just you in control.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8"
                onClick={() => window.location.href = '/onboard'}
              >
                <Key className="mr-2 h-5 w-5" />
                Create Your Identity
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-lg px-8"
                onClick={() => window.location.href = '/auth'}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-indigo-400">∞</div>
                <p className="text-sm text-gray-400">credentials supported</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">&lt;5s</div>
                <p className="text-sm text-gray-400">proof generation</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">100%</div>
                <p className="text-sm text-gray-400">privacy preserved</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">You</div>
                <p className="text-sm text-gray-400">own everything</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                The Identity Crisis of the Digital Age
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <Database className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Data silos everywhere</p>
                    <p className="text-sm text-gray-400">Your credentials locked in corporate systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <Lock className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Privacy violations</p>
                    <p className="text-sm text-gray-400">Over-sharing personal data for simple verifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <Users className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">No real ownership</p>
                    <p className="text-sm text-gray-400">You don't control your own identity</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 rounded-2xl border border-indigo-500/30">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  The PersonaPass Revolution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Self-sovereign identity</p>
                      <p className="text-sm text-gray-400">You own and control your decentralized identity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Zero-knowledge privacy</p>
                      <p className="text-sm text-gray-400">Prove facts without revealing personal data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Blockchain security</p>
                      <p className="text-sm text-gray-400">Tamper-proof credentials on PersonaChain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How PersonaPass Works</h2>
            <p className="text-xl text-gray-300">Build your digital identity in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Create Your DID</h3>
                <p className="text-gray-400">
                  Connect your wallet and create a decentralized identity (DID) on PersonaChain blockchain. No personal data required.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Add Credentials</h3>
                <p className="text-gray-400">
                  Create verifiable credentials for your education, work, skills, licenses—anything you want to prove about yourself.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Share with Privacy</h3>
                <p className="text-gray-400">
                  Generate zero-knowledge proofs to verify facts about yourself without revealing sensitive personal information.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600"
              onClick={() => window.location.href = '/onboard'}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start Building Your Identity
            </Button>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Identity Infrastructure</h2>
            <p className="text-xl text-gray-300">Everything you need for self-sovereign identity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {IDENTITY_FEATURES.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 backdrop-blur border-gray-700">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{feature.description}</p>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
                    {feature.stat}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Life Domains Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Credentials for Every Aspect of Life</h2>
            <p className="text-xl text-gray-300">Create verifiable credentials for everything that matters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {LIFE_DOMAINS.map((domain, index) => (
              <Card key={index} className="bg-gray-800/50 backdrop-blur border-gray-700 hover:border-indigo-500/50 transition-colors cursor-pointer" onClick={() => setSelectedDomain(index)}>
                <CardContent className="p-6">
                  <domain.icon className="h-12 w-12 text-indigo-400 mb-4" />
                  <h3 className="text-xl font-bold mb-3">{domain.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{domain.description}</p>
                  <div className="space-y-1">
                    {domain.examples.slice(0, 2).map((example, i) => (
                      <div key={i} className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-400" />
                        {example}
                      </div>
                    ))}
                    {domain.examples.length > 2 && (
                      <div className="text-xs text-indigo-400">+{domain.examples.length - 2} more</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">People Love PersonaPass</h2>
            <p className="text-xl text-gray-300">Join thousands building their digital identity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900/50 backdrop-blur border-gray-800">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Sparkles key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Access Your Identity Anywhere */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Access Your Identity Anywhere</h2>
            <p className="text-xl text-gray-300">Multiple ways to manage and share your credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <Globe className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Web Dashboard</h3>
                <p className="text-gray-400 mb-4">
                  Manage all your credentials in one secure, user-friendly web interface.
                </p>
                <Button variant="outline" className="border-gray-600">
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <Wallet className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Mobile Wallet</h3>
                <p className="text-gray-400 mb-4">
                  Coming soon: Native mobile app for iOS and Android with biometric security.
                </p>
                <Button variant="outline" className="border-gray-600">
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <Network className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">QR Code Sharing</h3>
                <p className="text-gray-400 mb-4">
                  Generate QR codes to instantly share proofs without revealing personal data.
                </p>
                <Button variant="outline" className="border-gray-600">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Start Free, Upgrade When Ready</h2>
            <p className="text-xl text-gray-300">Your digital identity platform. Your timeline. Your choice.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur border-indigo-700 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white px-4 py-1">
                  Recommended
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
                <p className="text-gray-300 mb-6">Perfect to get started</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-300">/month</span>
                </div>
                <p className="text-lg mb-6">Complete identity platform</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Unlimited DIDs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">50 credentials/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Basic ZK proofs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Web dashboard access</span>
                  </li>
                </ul>
                <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
                  Start Free Now
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-gray-400 mb-6">For power users</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-lg mb-6">Advanced features</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Unlimited credentials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Advanced ZK circuits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Mobile app access</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-gray-600">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-400 mb-6">For organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-lg mb-6">White-label solutions</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Bulk user management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">24/7 dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">On-premise deployment</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-gray-600">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="py-16 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Privacy is Our Promise</h2>
            <p className="text-xl text-gray-300">Built for self-sovereignty, secured with best practices</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-70">
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">🔐</div>
              </div>
              <p className="text-xs text-gray-400">Zero-Knowledge</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">⛓️</div>
              </div>
              <p className="text-xs text-gray-400">On-Chain Storage</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">🛡️</div>
              </div>
              <p className="text-xs text-gray-400">End-to-End Encryption</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">👑</div>
              </div>
              <p className="text-xs text-gray-400">Self-Sovereign</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">99.9%</div>
              </div>
              <p className="text-xs text-gray-400">Uptime Guarantee</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">🌐</div>
              </div>
              <p className="text-xs text-gray-400">Global Access</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400 max-w-3xl mx-auto">
              PersonaPass runs on PersonaChain blockchain with cryptographic security. 
              Your identity data never leaves your control. We don't store, sell, or 
              access your personal information - that's the power of self-sovereign identity.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Own Your Digital Identity?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the self-sovereign identity revolution. Create your decentralized identity in minutes 
            and take control of your digital life forever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8"
              onClick={() => window.location.href = '/onboard'}
            >
              <Key className="mr-2 h-5 w-5" />
              Create Your Identity
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8"
              onClick={() => window.location.href = '/auth'}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-400" />
                PersonaPass
              </h3>
              <p className="text-sm text-gray-400">
                Your complete digital identity platform. Self-sovereign, secure, and private.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/onboard" className="hover:text-white">Create Identity</Link></li>
                <li><Link href="/auth" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Identity</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/did" className="hover:text-white">Decentralized ID</Link></li>
                <li><Link href="/credentials" className="hover:text-white">Verifiable Credentials</Link></li>
                <li><Link href="/proofs" className="hover:text-white">Zero-Knowledge Proofs</Link></li>
                <li><Link href="/blockchain" className="hover:text-white">PersonaChain</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 PersonaPass. Powered by PersonaChain blockchain. Your identity, your control.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <p className="text-gray-400">Demo video placeholder - would show 90s product demo</p>
              </div>
              <div className="p-4">
                <Button
                  onClick={() => setShowVideo(false)}
                  variant="outline"
                  className="w-full border-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}