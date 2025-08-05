'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  ShieldCheck,
  Code,
  Key,
  Activity,
  TrendingUp,
  Calendar,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

export default function MerchantDashboard() {
  const [copied, setCopied] = useState(false)
  const [apiKey] = useState('pk_live_1234567890abcdef') // Mock API key
  
  // Mock data - in production this would come from API
  const stats = {
    totalVerifications: 1247,
    monthlyVerifications: 342,
    successRate: 98.5,
    avgResponseTime: 1.2,
    revenue: 17.10,
    activeUsers: 89
  }

  const recentVerifications = [
    { id: '1', age: 'Over 21', timestamp: new Date(Date.now() - 1000 * 60 * 5), status: 'verified' },
    { id: '2', age: 'Over 18', timestamp: new Date(Date.now() - 1000 * 60 * 15), status: 'verified' },
    { id: '3', age: 'Over 21', timestamp: new Date(Date.now() - 1000 * 60 * 30), status: 'failed' },
    { id: '4', age: 'Over 18', timestamp: new Date(Date.now() - 1000 * 60 * 45), status: 'verified' },
  ]

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Merchant Dashboard</h1>
          <p className="text-gray-400">Monitor your age verification performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Verifications
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVerifications.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                +{stats.monthlyVerifications} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Success Rate
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Industry leading accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Response Time
              </CardTitle>
              <Activity className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
              <p className="text-xs text-gray-500 mt-1">
                95% faster than KYC
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Monthly Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.revenue}</div>
              <p className="text-xs text-gray-500 mt-1">
                $0.05 per verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Key Section */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Your API Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-800 p-3 rounded font-mono text-sm">
                    {apiKey}
                  </code>
                  <Button
                    onClick={copyApiKey}
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button variant="outline" className="border-gray-700">
                  <Code className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" className="border-gray-700">
                  Download SDK
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Verifications
              </span>
              <Button variant="ghost" size="sm" className="text-gray-400">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVerifications.map((verification) => (
                <div 
                  key={verification.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={verification.status === 'verified' ? 'success' : 'destructive'}
                      className="capitalize"
                    >
                      {verification.status}
                    </Badge>
                    <span className="text-sm">{verification.age}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(verification.timestamp)} ago
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20 mt-8">
          <CardHeader>
            <CardTitle>Quick Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Install the SDK</h4>
                <code className="block bg-gray-900 p-3 rounded text-sm">
                  npm install @personapass/verify
                </code>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Initialize PersonaPass</h4>
                <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`import { PersonaPass } from '@personapass/verify';

const personapass = new PersonaPass({
  apiKey: '${apiKey}'
});

const session = await personapass.verifyAge({
  minimumAge: 21
});`}</pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Start Verifying</h4>
                <p className="text-sm text-gray-400">
                  That's it! Your users can now verify their age with one click, 
                  no personal data required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}