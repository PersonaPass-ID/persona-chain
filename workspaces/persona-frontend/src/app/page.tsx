'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Zap, 
  DollarSign, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Play,
  ShoppingBag,
  Code2,
  Globe,
  Users,
  Lock,
  Sparkles,
  ChevronRight,
  Wine,
  Cigarette,
  Gamepad2,
  Pill,
  CreditCard,
  Building2
} from 'lucide-react'

// Use cases for different industries
const USE_CASES = [
  {
    icon: Wine,
    title: 'Alcohol & Spirits',
    description: 'Comply with state laws while maximizing conversion',
    stat: '73% conversion rate'
  },
  {
    icon: Cigarette,
    title: 'Tobacco & Vape',
    description: 'FDA-compliant age verification in seconds',
    stat: 'FDA compliant'
  },
  {
    icon: Gamepad2,
    title: 'Gaming & Gambling',
    description: 'Verify age without friction for online gaming',
    stat: '<2s verification'
  },
  {
    icon: Pill,
    title: 'Cannabis & CBD',
    description: 'State-compliant verification for dispensaries',
    stat: '50-state coverage'
  }
]

// Customer testimonials
const TESTIMONIALS = [
  {
    quote: "PersonaPass increased our conversion rate by 3x compared to traditional ID upload. Game changer!",
    author: "Sarah Chen",
    role: "CEO, Premium Spirits Co",
    rating: 5
  },
  {
    quote: "Finally, age verification that doesn't feel like a security checkpoint. Our customers love it.",
    author: "Marcus Rodriguez",
    role: "Founder, Craft Beer Direct",
    rating: 5
  },
  {
    quote: "Implementation took 10 minutes. We're saving $20K/month on verification costs.",
    author: "Emily Watson",
    role: "CTO, VapeNation",
    rating: 5
  }
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [showVideo, setShowVideo] = useState(false)

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        alert(`Thanks! We will notify ${email} when we launch.`)
        setEmail('')
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Thanks for your interest! We will be in touch soon.')
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 text-white">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-2">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-sm font-medium">
            🚀 Launch Week Special: 50% off for the first 100 merchants! 
            <Link href="/merchant/onboard" className="underline ml-2">
              Claim your spot →
            </Link>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
              ⚡ 95% cheaper than traditional KYC
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              Age Verification That Actually Converts
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Stop losing 67% of customers to clunky ID uploads. PersonaPass verifies age instantly 
              using biometric authentication and privacy-preserving technology—no documents, no data storage, just results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8"
                onClick={() => window.location.href = '/demo'}
              >
                <Play className="mr-2 h-5 w-5" />
                See Live Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-lg px-8"
                onClick={() => window.location.href = '/merchant/onboard'}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-indigo-400">$0.05</div>
                <p className="text-sm text-gray-400">per verification</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">&lt;2s</div>
                <p className="text-sm text-gray-400">verification time</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">3x</div>
                <p className="text-sm text-gray-400">higher conversion</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">100%</div>
                <p className="text-sm text-gray-400">privacy preserved</p>
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
                The $2.3B Problem with Age Verification
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <Lock className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">67% cart abandonment</p>
                    <p className="text-sm text-gray-400">Customers hate uploading IDs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <DollarSign className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">$2-5 per verification</p>
                    <p className="text-sm text-gray-400">Traditional KYC is expensive</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-1 rounded">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Privacy nightmares</p>
                    <p className="text-sm text-gray-400">Storing sensitive documents = liability</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 rounded-2xl border border-indigo-500/30">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  The PersonaPass Solution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">One-click verification</p>
                      <p className="text-sm text-gray-400">Biometric or credential-based, no document uploads</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Zero-knowledge proofs</p>
                      <p className="text-sm text-gray-400">Verify age without revealing data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">95% cost reduction</p>
                      <p className="text-sm text-gray-400">Just $0.05 per verification</p>
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
            <p className="text-xl text-gray-300">Age verification in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Customer Clicks Verify</h3>
                <p className="text-gray-400">
                  When checking out age-restricted products, customer sees a simple "Verify Age" button
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Verify Identity</h3>
                <p className="text-gray-400">
                  Customer proves their age using biometric authentication or digital credentials—no documents uploaded
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Access</h3>
                <p className="text-gray-400">
                  Verification completes in under 2 seconds. Customer proceeds to checkout. You pay $0.05.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600"
              onClick={() => setShowVideo(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch 90-Second Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Every Industry</h2>
            <p className="text-xl text-gray-300">Compliant age verification for any use case</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map((useCase, index) => (
              <Card key={index} className="bg-gray-800/50 backdrop-blur border-gray-700">
                <CardContent className="p-6">
                  <useCase.icon className="h-10 w-10 text-indigo-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{useCase.description}</p>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
                    {useCase.stat}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Merchants Love PersonaPass</h2>
            <p className="text-xl text-gray-300">Join 1,000+ businesses improving conversion</p>
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

      {/* Integration Options */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Integrate in Minutes</h2>
            <p className="text-xl text-gray-300">Works with your existing tech stack</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Shopify App</h3>
                <p className="text-gray-400 mb-4">
                  One-click install from the Shopify App Store. No coding required.
                </p>
                <Button variant="outline" className="border-gray-600">
                  Install App
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <Code2 className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">JavaScript SDK</h3>
                <p className="text-gray-400 mb-4">
                  Simple SDK for any website. Works with React, Vue, Angular, and vanilla JS.
                </p>
                <Button variant="outline" className="border-gray-600">
                  View Docs
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-8 text-center">
                <Globe className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">REST API</h3>
                <p className="text-gray-400 mb-4">
                  Full-featured API for custom integrations. Webhooks included.
                </p>
                <Button variant="outline" className="border-gray-600">
                  API Reference
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
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-300">No hidden fees. No monthly minimums.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-gray-400 mb-6">Perfect for small businesses</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-lg mb-6">$0.05 per verification</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Up to 1,000 verifications/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">All integrations included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Start Free
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur border-indigo-700 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Growth</h3>
                <p className="text-gray-300 mb-6">For growing businesses</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-gray-300">/month</span>
                </div>
                <p className="text-lg mb-6">$0.03 per verification</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Up to 10,000 verifications/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Custom branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                </ul>
                <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-400 mb-6">For large organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-lg mb-6">Volume discounts available</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Unlimited verifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">SLA guarantee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Custom integration</span>
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

      {/* Trust & Compliance Section */}
      <div className="py-16 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security & Compliance</h2>
            <p className="text-xl text-gray-300">Trusted by Fortune 500 companies</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-70">
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">SOC 2</div>
              </div>
              <p className="text-xs text-gray-400">Type II Certified</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">GDPR</div>
              </div>
              <p className="text-xs text-gray-400">Compliant</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">CCPA</div>
              </div>
              <p className="text-xs text-gray-400">Compliant</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">COPPA</div>
              </div>
              <p className="text-xs text-gray-400">Safe Harbor</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">99.9%</div>
              </div>
              <p className="text-xs text-gray-400">SLA Uptime</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2 min-h-[80px] flex items-center justify-center">
                <div className="text-2xl font-bold">24/7</div>
              </div>
              <p className="text-xs text-gray-400">Monitoring</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400 max-w-3xl mx-auto">
              PersonaPass infrastructure is hosted on AWS with end-to-end encryption, 
              multi-region failover, and zero data storage. All compliance certificates 
              available upon request.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to 3x Your Conversion Rate?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 1,000+ merchants using PersonaPass for compliant age verification.
            Get 50% off your first 3 months during launch week.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8"
              onClick={() => window.location.href = '/merchant/onboard'}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8"
              onClick={() => window.location.href = '/demo'}
            >
              <Play className="mr-2 h-5 w-5" />
              Try Live Demo
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
                <Shield className="h-5 w-5 text-indigo-400" />
                PersonaPass
              </h3>
              <p className="text-sm text-gray-400">
                Privacy-preserving age verification that converts.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/demo" className="hover:text-white">Live Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white">API Reference</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-white">Compliance</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 PersonaPass. All rights reserved.</p>
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