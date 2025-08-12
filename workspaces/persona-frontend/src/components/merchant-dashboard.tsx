'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Shield, 
  Users, 
  TrendingUp, 
  DollarSign,
  Key,
  Code,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface VerificationStats {
  total: number;
  verified: number;
  rejected: number;
  revenue: number;
  avgResponseTime: number;
}

interface MerchantDashboardProps {
  merchantId: string;
  apiKey: string;
}

export function MerchantDashboard({ merchantId, apiKey }: MerchantDashboardProps) {
  const [stats, setStats] = useState<VerificationStats>({
    total: 12453,
    verified: 11897,
    rejected: 556,
    revenue: 622.65,
    avgResponseTime: 1.2
  });

  const [recentVerifications, setRecentVerifications] = useState([
    { id: '1', timestamp: '2 min ago', status: 'verified', location: 'California', confidence: 0.99 },
    { id: '2', timestamp: '5 min ago', status: 'verified', location: 'Texas', confidence: 0.98 },
    { id: '3', timestamp: '8 min ago', status: 'rejected', location: 'Florida', confidence: 0.45 },
    { id: '4', timestamp: '12 min ago', status: 'verified', location: 'New York', confidence: 0.97 }
  ]);

  const verificationRate = ((stats.verified / stats.total) * 100).toFixed(1);
  const monthlyRevenue = stats.revenue.toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PersonaPass Merchant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Privacy-preserving age verification for your e-commerce store
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verificationRate}%</div>
              <p className="text-xs text-muted-foreground">
                Industry leading accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
              <p className="text-xs text-muted-foreground">
                50x faster than traditional KYC
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">
                vs $2,490 with traditional KYC
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Recent Verifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Verifications</CardTitle>
                <CardDescription>Real-time age verification activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentVerifications.map((verification) => (
                    <div key={verification.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {verification.status === 'verified' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Age Verification</p>
                          <p className="text-xs text-gray-500">{verification.timestamp} • {verification.location}</p>
                        </div>
                      </div>
                      <Badge variant={verification.status === 'verified' ? 'default' : 'destructive'}>
                        {verification.status === 'verified' ? 'Verified' : 'Rejected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why PersonaPass?</CardTitle>
                <CardDescription>Industry-leading privacy-preserving age verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-green-500" />
                      Zero Personal Data Storage
                    </h4>
                    <p className="text-sm text-gray-600">
                      We never store birthdates or personal information. Only proof of age.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                      95% Cost Reduction
                    </h4>
                    <p className="text-sm text-gray-600">
                      $0.05 per verification vs $2+ for traditional KYC providers.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      Higher Conversion Rates
                    </h4>
                    <p className="text-sm text-gray-600">
                      One-click verification increases checkout completion by 68%.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                      Full Regulatory Compliance
                    </h4>
                    <p className="text-sm text-gray-600">
                      Meets all state and federal age verification requirements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Integration</CardTitle>
                <CardDescription>Add PersonaPass to your store in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key */}
                <div>
                  <label className="text-sm font-medium">Your API Key</label>
                  <div className="flex mt-1">
                    <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {apiKey}
                    </code>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Key className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Integration Code */}
                <div>
                  <label className="text-sm font-medium">JavaScript Integration</label>
                  <pre className="mt-1 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                    <code className="text-sm">{`// Install the SDK
npm install @personapass/verify

// Initialize PersonaPass
import PersonaPass from '@personapass/verify';

const personapass = new PersonaPass({
  apiKey: '${apiKey}'
});

// Verify age with one line
const isOver21 = await personapass.verifyAge(21);`}</code>
                  </pre>
                </div>

                {/* Platform Integrations */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform Integrations</label>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Button variant="outline" className="justify-start">
                      <Code className="h-4 w-4 mr-2" />
                      Shopify App
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Code className="h-4 w-4 mr-2" />
                      WooCommerce Plugin
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Code className="h-4 w-4 mr-2" />
                      BigCommerce
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>Download verification logs for regulatory compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Monthly Compliance Report (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Verification Logs (CSV)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    State-by-State Compliance Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan: Professional</CardTitle>
                <CardDescription>$500/month for unlimited verifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Current Usage</p>
                        <p className="text-sm text-gray-600">12,453 verifications this month</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">$500</p>
                        <p className="text-sm text-gray-600">Unlimited</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      💰 You saved $2,490 compared to traditional KYC this month!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}