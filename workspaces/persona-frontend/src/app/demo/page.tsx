'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  DollarSign,
  BarChart3,
  Users,
  Lock,
  Unlock,
  ChevronRight,
  Wine,
  Package,
  CreditCard,
  Timer,
  Globe,
  Smartphone
} from 'lucide-react'
import Script from 'next/script'

// Mock product data
const DEMO_PRODUCTS = [
  {
    id: 'wine-1',
    name: 'Premium Cabernet Sauvignon 2019',
    price: '$89.99',
    image: '/demo/wine1.jpg',
    restricted: true,
    category: 'Wine',
    minimumAge: 21
  },
  {
    id: 'wine-2',
    name: 'French Bordeaux Reserve',
    price: '$124.99',
    image: '/demo/wine2.jpg',
    restricted: true,
    category: 'Wine',
    minimumAge: 21
  },
  {
    id: 'wine-3',
    name: 'Sparkling Champagne Brut',
    price: '$156.99',
    image: '/demo/wine3.jpg',
    restricted: true,
    category: 'Wine',
    minimumAge: 21
  },
  {
    id: 'accessory-1',
    name: 'Wine Opener Set',
    price: '$34.99',
    image: '/demo/opener.jpg',
    restricted: false,
    category: 'Accessories'
  }
]

export default function DemoPage() {
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const [demoStats, setDemoStats] = useState({
    verifications: 0,
    revenue: 0,
    conversionRate: 0,
    avgTime: 0
  })

  // Simulate real-time stats
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStats(prev => ({
        verifications: prev.verifications + Math.floor(Math.random() * 3),
        revenue: prev.revenue + (Math.random() * 0.15),
        conversionRate: 73 + Math.random() * 5,
        avgTime: 1.2 + Math.random() * 0.8
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleVerify = async () => {
    setVerifying(true)
    
    // Simulate verification flow
    setTimeout(() => {
      // In production, this would open PersonaPass verification
      // For demo, we'll simulate success
      setVerified(true)
      setVerifying(false)
      
      // Track demo analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'demo_verification_completed', {
          product_id: selectedProduct?.id,
          minimum_age: selectedProduct?.minimumAge
        })
      }
    }, 2000)
  }

  const handleProductClick = (product: any) => {
    if (product.restricted && !verified) {
      setSelectedProduct(product)
    } else {
      // In production, this would add to cart
      alert(`Added ${product.name} to cart!`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 text-white">
      {/* Demo Banner */}
      <div className="bg-yellow-500/20 border-y border-yellow-500/50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">
              This is a demo of PersonaPass Age Verification
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide' : 'Show'} Live Stats
          </Button>
        </div>
      </div>

      {/* Live Stats Dashboard */}
      {showStats && (
        <div className="bg-gray-900/50 backdrop-blur border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Today's Verifications</p>
                      <p className="text-2xl font-bold">{demoStats.verifications.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Revenue Generated</p>
                      <p className="text-2xl font-bold">${demoStats.revenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Conversion Rate</p>
                      <p className="text-2xl font-bold">{demoStats.conversionRate.toFixed(1)}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Avg Verification Time</p>
                      <p className="text-2xl font-bold">{demoStats.avgTime.toFixed(1)}s</p>
                    </div>
                    <Timer className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Demo Store Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Wine className="h-10 w-10 text-indigo-400" />
                Premium Wine Shop
              </h1>
              <p className="text-gray-300">Experience PersonaPass age verification in action</p>
            </div>
            {verified && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Age Verified (21+)
              </Badge>
            )}
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="font-semibold">Instant Verification</p>
                <p className="text-sm text-gray-400">Complete in under 2 seconds</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold">100% Private</p>
                <p className="text-sm text-gray-400">No personal data stored</p>
              </div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex items-center gap-3">
              <Globe className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <div>
                <p className="font-semibold">Works Globally</p>
                <p className="text-sm text-gray-400">Any wallet, any country</p>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {DEMO_PRODUCTS.map((product) => (
              <Card 
                key={product.id}
                className={`bg-gray-900/50 backdrop-blur border-gray-800 cursor-pointer transition-all hover:scale-105 ${
                  product.restricted && !verified ? 'opacity-75' : ''
                }`}
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Product Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg flex items-center justify-center">
                      {product.category === 'Wine' ? (
                        <Wine className="h-24 w-24 text-gray-700" />
                      ) : (
                        <Package className="h-24 w-24 text-gray-700" />
                      )}
                    </div>
                    
                    {product.restricted && (
                      <div className="absolute top-2 right-2">
                        <Badge className={`${
                          verified 
                            ? 'bg-green-500/20 text-green-300 border-green-500/50' 
                            : 'bg-red-500/20 text-red-300 border-red-500/50'
                        }`}>
                          {verified ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          21+
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-indigo-400">{product.price}</span>
                      <Button
                        size="sm"
                        variant={product.restricted && !verified ? "secondary" : "default"}
                        className={product.restricted && !verified ? "bg-gray-700" : "bg-indigo-600 hover:bg-indigo-700"}
                      >
                        {product.restricted && !verified ? 'Verify Age' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Age Verification Modal */}
      {selectedProduct && !verified && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                Age Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300">
                  You must be 21 or older to purchase alcohol products. 
                  Verify your age instantly with PersonaPass.
                </p>

                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm">No ID upload required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm">100% private - no data stored</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm">Instant verification</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {verifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-4 w-4" />
                        Verify My Age
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full border-gray-700"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  By verifying, you agree to PersonaPass processing your age verification.
                  Learn more about our <a href="#" className="text-indigo-400 hover:underline">privacy policy</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {verified && (
        <div className="fixed bottom-8 right-8 max-w-sm animate-slide-up">
          <Card className="bg-green-900/90 backdrop-blur border-green-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-300">Age Verified!</p>
                  <p className="text-sm text-green-200 mt-1">
                    You can now purchase age-restricted products. Your verification is valid for 30 days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gray-900/50 py-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Increase Your Conversion Rate by 3x?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 1,000+ merchants using PersonaPass for compliant age verification
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => window.location.href = '/merchant/onboard'}
            >
              Start Free Trial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600"
              onClick={() => window.location.href = '/merchant/dashboard'}
            >
              View Documentation
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-indigo-400 mb-2">$0.05</div>
              <p className="text-gray-400">Per verification</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">73%</div>
              <p className="text-gray-400">Average conversion rate</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">1.8s</div>
              <p className="text-gray-400">Average verification time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="bg-gray-950 py-8 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-sm text-gray-500">
            💡 <strong>Demo Note:</strong> In production, clicking "Verify My Age" would open a secure PersonaPass 
            verification flow where users connect their wallet and generate a zero-knowledge proof of age. 
            For this demo, we simulate instant verification.
          </p>
        </div>
      </div>

      {/* Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
    </div>
  )
}