'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { PRICING_TIERS } from '@/lib/stripe/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function MerchantBilling() {
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [upgrading, setUpgrading] = useState(false)
  
  useEffect(() => {
    fetchBillingInfo()
  }, [])

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/merchant/billing', {
        headers: {
          'Authorization': 'Bearer pk_live_1234567890abcdef' // Mock API key
        }
      })
      const data = await response.json()
      setBilling(data.billing)
      setUsage(data.usage)
    } catch (error) {
      console.error('Error fetching billing info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: 'GROWTH' | 'ENTERPRISE') => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/merchant/billing', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_live_1234567890abcdef',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upgrade',
          plan
        })
      })
      
      const { clientSecret } = await response.json()
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise
      if (stripe && clientSecret) {
        const { error } = await stripe.confirmCardPayment(clientSecret)
        if (!error) {
          // Refresh billing info
          await fetchBillingInfo()
        }
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setUpgrading(false)
    }
  }

  const downloadInvoice = () => {
    // In production, generate and download invoice
    console.log('Downloading invoice...')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const currentPlan = billing?.plan || 'starter'
  const monthlySpend = usage?.totalCost || 17.10
  const projectedMonthly = monthlySpend * 30 / new Date().getDate()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-gray-400">Manage your subscription and track usage</p>
        </div>

        {/* Current Plan */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              <Badge variant={currentPlan === 'growth' ? 'success' : 'secondary'}>
                {currentPlan.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Monthly Spend</p>
                <p className="text-2xl font-bold">${monthlySpend.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Projected: ${projectedMonthly.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Verifications</p>
                <p className="text-2xl font-bold">{usage?.totalVerifications || 342}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${(0.05).toFixed(2)} each
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Payment Method</p>
                <div className="flex items-center gap-2 mt-2">
                  {billing?.hasPaymentMethod ? (
                    <>
                      <CreditCard className="h-5 w-5 text-green-400" />
                      <span className="text-sm">•••• 4242</span>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700"
                    >
                      Add Payment Method
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Chart */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {usage?.dailyUsage?.slice(-30).map((day: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-400 transition-colors relative group"
                  style={{ height: `${(day.count / 60) * 100}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.count} verifications
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className={`p-6 rounded-lg border ${currentPlan === 'starter' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700'}`}>
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-gray-400 text-sm mb-4">Perfect for getting started</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Pay as you go
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    $0.05 per verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Basic support
                  </li>
                </ul>
                {currentPlan === 'starter' && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Current Plan
                  </Badge>
                )}
              </div>

              {/* Growth Plan */}
              <div className={`p-6 rounded-lg border ${currentPlan === 'growth' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700'}`}>
                <h3 className="text-xl font-bold mb-2">Growth</h3>
                <p className="text-gray-400 text-sm mb-4">For growing businesses</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$500</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Unlimited verifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Advanced analytics
                  </li>
                </ul>
                {currentPlan === 'starter' && (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUpgrade('GROWTH')}
                    disabled={upgrading}
                  >
                    {upgrading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Upgrade to Growth'
                    )}
                  </Button>
                )}
                {currentPlan === 'growth' && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Current Plan
                  </Badge>
                )}
              </div>

              {/* Enterprise Plan */}
              <div className="p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-400 text-sm mb-4">For large organizations</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">Custom</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Volume discounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Dedicated support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Custom integration
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  variant="outline"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="bg-gray-900 border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Invoices</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadInvoice}
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">November 2024</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">$17.10</span>
                  <Badge variant="success" className="text-xs">
                    Paid
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">October 2024</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">$15.85</span>
                  <Badge variant="success" className="text-xs">
                    Paid
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}