'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  DollarSign,
  Users,
  BarChart3,
  Code2,
  ShoppingBag
} from 'lucide-react'
import { createMerchant } from '@/lib/auth/api-key'
import { createOrUpdateCustomer, createSetupIntent } from '@/lib/stripe/client'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function MerchantOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [merchantData, setMerchantData] = useState({
    email: '',
    company: '',
    website: '',
    phone: '',
    useCase: '',
    monthlyVolume: ''
  })
  const [apiKey, setApiKey] = useState('')
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMerchantData({
      ...merchantData,
      [e.target.name]: e.target.value
    })
  }

  const handleCreateAccount = async () => {
    setLoading(true)
    try {
      // Create merchant account
      const merchant = await createMerchant(merchantData.email, merchantData.company)
      setApiKey(merchant.apiKey)
      
      // Create Stripe customer
      await createOrUpdateCustomer(merchantData.email, {
        company: merchantData.company,
        merchantId: merchant.id
      })
      
      setStep(2)
    } catch (error) {
      console.error('Failed to create account:', error)
      alert('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    setLoading(true)
    try {
      // Create setup intent
      const response = await fetch('/api/merchant/billing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add_payment_method'
        })
      })
      
      const { clientSecret } = await response.json()
      
      // Open Stripe payment element
      const stripe = await stripePromise
      if (stripe && clientSecret) {
        const { error } = await stripe.confirmCardSetup(clientSecret)
        if (!error) {
          setPaymentComplete(true)
          setStep(3)
        } else {
          alert('Payment setup failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to add payment method:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
              🚀 Launch Week Special - 50% Off First 3 Months
            </Badge>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              Welcome to PersonaPass
            </h1>
            <p className="text-xl text-gray-300">
              Privacy-preserving age verification that's 95% cheaper than KYC
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-1">$0.05 per verification</h3>
              <p className="text-sm text-gray-400">95% cheaper than KYC</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="font-semibold mb-1">&lt;2 seconds</h3>
              <p className="text-sm text-gray-400">Instant verification</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-1">100% Private</h3>
              <p className="text-sm text-gray-400">Zero data storage</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="font-semibold mb-1">3x Conversion</h3>
              <p className="text-sm text-gray-400">vs document upload</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 ${
                step >= 2 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}>
                2
              </div>
              <div className={`w-24 h-1 ${
                step >= 3 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 3 ? 'bg-indigo-600' : 'bg-gray-700'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Account Creation */}
          {step === 1 && (
            <Card className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Merchant Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Business Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="email"
                          name="email"
                          value={merchantData.email}
                          onChange={handleInputChange}
                          placeholder="merchant@company.com"
                          className="pl-10 bg-gray-800 border-gray-700"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="text"
                          name="company"
                          value={merchantData.company}
                          onChange={handleInputChange}
                          placeholder="Acme Inc."
                          className="pl-10 bg-gray-800 border-gray-700"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="url"
                          name="website"
                          value={merchantData.website}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                          className="pl-10 bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Phone (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="tel"
                          name="phone"
                          value={merchantData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          className="pl-10 bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Use Case</label>
                    <select
                      name="useCase"
                      value={merchantData.useCase}
                      onChange={(e) => setMerchantData({...merchantData, useCase: e.target.value})}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                      <option value="">Select your use case</option>
                      <option value="alcohol">Alcohol Sales</option>
                      <option value="tobacco">Tobacco/Vape Products</option>
                      <option value="cannabis">Cannabis</option>
                      <option value="gambling">Gambling/Gaming</option>
                      <option value="adult">Adult Content</option>
                      <option value="other">Other Age-Restricted Products</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Expected Monthly Verifications</label>
                    <select
                      name="monthlyVolume"
                      value={merchantData.monthlyVolume}
                      onChange={(e) => setMerchantData({...merchantData, monthlyVolume: e.target.value})}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                      <option value="">Select expected volume</option>
                      <option value="<100">Less than 100</option>
                      <option value="100-1000">100 - 1,000</option>
                      <option value="1000-10000">1,000 - 10,000</option>
                      <option value="10000+">10,000+</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleCreateAccount}
                    disabled={loading || !merchantData.email || !merchantData.company}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Setup */}
          {step === 2 && (
            <Card className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Account Created!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Your API Key</p>
                    <code className="text-sm font-mono bg-gray-900 p-2 rounded block">
                      {apiKey}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      Save this key securely. You won't be able to see it again.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Add Payment Method</h3>
                    <p className="text-gray-400 mb-4">
                      Add a payment method to activate your account. You'll only be charged for successful verifications.
                    </p>
                    
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
                      <p className="text-sm">
                        <strong>Starter Plan:</strong> $0.05 per verification
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Upgrade to Growth ($500/mo) for unlimited verifications
                      </p>
                    </div>

                    <Button
                      onClick={handleAddPaymentMethod}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {loading ? 'Loading...' : 'Add Payment Method'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Integration */}
          {step === 3 && (
            <Card className="max-w-3xl mx-auto bg-gray-900/50 backdrop-blur border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  You're All Set!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Code2 className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Quick Start Guide</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Integrate in minutes with our SDK
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-gray-600"
                          onClick={() => router.push('/merchant/dashboard')}
                        >
                          View Guide
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <ShoppingBag className="h-12 w-12 text-green-400 mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Shopify App</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          One-click Shopify integration
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-gray-600"
                        >
                          Install App
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Users className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Get Support</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Join our Discord community
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-gray-600"
                        >
                          Join Discord
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Quick Integration Example</h4>
                    <pre className="bg-gray-900 p-4 rounded overflow-x-auto">
                      <code className="text-sm">{`import { PersonaPass } from '@personapass/verify';

const personapass = new PersonaPass({
  apiKey: '${apiKey}'
});

const session = await personapass.verifyAge({
  minimumAge: 21,
  redirectUrl: 'https://yoursite.com/verified'
});

window.location.href = session.verificationUrl;`}</code>
                    </pre>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => router.push('/merchant/dashboard')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-900/50 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Trusted by 1,000+ Merchants</h2>
            <p className="text-gray-400">Processing over 1M verifications per month</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-50">
            <div className="text-center font-semibold text-xl">TechCorp</div>
            <div className="text-center font-semibold text-xl">RetailMax</div>
            <div className="text-center font-semibold text-xl">CloudShop</div>
            <div className="text-center font-semibold text-xl">DigiStore</div>
          </div>
        </div>
      </div>
    </div>
  )
}