/**
 * ENTERPRISE MERCHANT DASHBOARD
 * 
 * Comprehensive dashboard for businesses to manage identity verification,
 * compliance, customer onboarding, and analytics.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Settings,
  Download,
  Upload,
  Filter,
  Search,
  Bell,
  Globe,
  Lock,
  Key,
  UserCheck,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface MerchantProfile {
  id: string
  name: string
  type: 'fintech' | 'healthcare' | 'ecommerce' | 'gaming' | 'defi' | 'enterprise'
  tier: 'starter' | 'professional' | 'enterprise'
  complianceLevel: 'basic' | 'enhanced' | 'full'
  apiKey: string
  webhookUrl?: string
  settings: MerchantSettings
}

interface MerchantSettings {
  kycLevel: 'basic' | 'enhanced' | 'full'
  allowedRegions: string[]
  blockedRegions: string[]
  complianceFrameworks: string[]
  automaticApproval: boolean
  manualReviewThreshold: number
  retentionPeriod: number // days
}

interface VerificationStats {
  total: number
  approved: number
  rejected: number
  pending: number
  averageTime: number // minutes
  successRate: number // percentage
}

interface ComplianceReport {
  framework: string
  status: 'compliant' | 'partial' | 'non-compliant'
  lastAudit: Date
  issues: ComplianceIssue[]
}

interface ComplianceIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  dueDate?: Date
}

interface Customer {
  id: string
  did: string
  email: string
  status: 'verified' | 'pending' | 'rejected' | 'suspicious'
  verificationLevel: 'tier1' | 'tier2' | 'tier3'
  riskScore: number
  onboardedAt: Date
  lastActive: Date
  country: string
  verificationMethods: string[]
}

interface ApiUsage {
  endpoint: string
  calls: number
  successRate: number
  avgResponseTime: number
  errors: number
}

interface MerchantDashboardProps {
  merchantId: string
}

export function MerchantDashboard({ merchantId }: MerchantDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null)
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([])
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadMerchantData()
  }, [merchantId])

  const loadMerchantData = async () => {
    setLoading(true)
    try {
      // Simulate API calls - replace with real implementation
      await Promise.all([
        loadMerchantProfile(),
        loadVerificationStats(),
        loadCustomers(),
        loadComplianceReports(),
        loadApiUsage()
      ])
    } catch (error) {
      console.error('Failed to load merchant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMerchantProfile = async () => {
    // Mock data - replace with API call
    setMerchant({
      id: merchantId,
      name: 'Acme Financial Services',
      type: 'fintech',
      tier: 'enterprise',
      complianceLevel: 'full',
      apiKey: 'pk_live_abc123...',
      webhookUrl: 'https://api.acmefinancial.com/webhooks/persona',
      settings: {
        kycLevel: 'enhanced',
        allowedRegions: ['US', 'EU', 'CA'],
        blockedRegions: ['NK', 'IR', 'SY'],
        complianceFrameworks: ['SOC2', 'GDPR', 'CCPA', 'PCI-DSS'],
        automaticApproval: false,
        manualReviewThreshold: 75,
        retentionPeriod: 2555 // 7 years
      }
    })
  }

  const loadVerificationStats = async () => {
    // Mock data
    setStats({
      total: 12450,
      approved: 10863,
      rejected: 1245,
      pending: 342,
      averageTime: 4.2,
      successRate: 87.3
    })
  }

  const loadCustomers = async () => {
    // Mock data
    const mockCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => ({
      id: `cust_${i + 1}`,
      did: `did:persona:mainnet:${Math.random().toString(36).substr(2, 16)}`,
      email: `user${i + 1}@example.com`,
      status: ['verified', 'pending', 'rejected', 'suspicious'][Math.floor(Math.random() * 4)] as any,
      verificationLevel: ['tier1', 'tier2', 'tier3'][Math.floor(Math.random() * 3)] as any,
      riskScore: Math.floor(Math.random() * 100),
      onboardedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      country: ['US', 'CA', 'GB', 'DE', 'FR', 'AU'][Math.floor(Math.random() * 6)],
      verificationMethods: ['email', 'phone', 'document', 'biometric'].slice(0, Math.floor(Math.random() * 4) + 1)
    }))
    setCustomers(mockCustomers)
  }

  const loadComplianceReports = async () => {
    // Mock data
    setComplianceReports([
      {
        framework: 'GDPR',
        status: 'compliant',
        lastAudit: new Date('2024-01-15'),
        issues: []
      },
      {
        framework: 'SOC2 Type II',
        status: 'compliant',
        lastAudit: new Date('2023-12-01'),
        issues: []
      },
      {
        framework: 'PCI-DSS',
        status: 'partial',
        lastAudit: new Date('2024-01-20'),
        issues: [
          {
            severity: 'medium',
            description: 'Encryption key rotation overdue',
            recommendation: 'Rotate encryption keys within 30 days',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ])
  }

  const loadApiUsage = async () => {
    // Mock data
    setApiUsage([
      { endpoint: '/api/verify', calls: 8429, successRate: 98.2, avgResponseTime: 245, errors: 152 },
      { endpoint: '/api/kyc/create', calls: 3421, successRate: 96.8, avgResponseTime: 1200, errors: 109 },
      { endpoint: '/api/credentials', calls: 2156, successRate: 99.1, avgResponseTime: 180, errors: 19 },
      { endpoint: '/api/webhooks', calls: 12450, successRate: 99.8, avgResponseTime: 95, errors: 25 }
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'compliant':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'non-compliant':
        return 'bg-red-100 text-red-800'
      case 'suspicious':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading || !merchant || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{merchant.name}</h1>
            <p className="text-gray-600">
              {merchant.type.charAt(0).toUpperCase() + merchant.type.slice(1)} • {merchant.tier.charAt(0).toUpperCase() + merchant.tier.slice(1)} Plan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {merchant.complianceLevel.charAt(0).toUpperCase() + merchant.complianceLevel.slice(1)} Compliance
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                    <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-green-600 mt-2">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{stats.successRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-2">+2.3% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
                    <p className="text-2xl font-bold">{stats.averageTime}m</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-red-600 mt-2">+0.8m from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Requires manual review</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'verification', message: 'KYC verification completed for user@example.com', time: '2 minutes ago', status: 'approved' },
                    { type: 'alert', message: 'High-risk user flagged for manual review', time: '15 minutes ago', status: 'pending' },
                    { type: 'compliance', message: 'SOC2 audit report generated', time: '1 hour ago', status: 'completed' },
                    { type: 'api', message: 'API rate limit reached for /verify endpoint', time: '2 hours ago', status: 'warning' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'verification' && <UserCheck className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {activity.type === 'compliance' && <Shield className="h-4 w-4 text-green-500" />}
                        {activity.type === 'api' && <Activity className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center gap-2 h-auto py-4">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Export Data</div>
                      <div className="text-sm text-gray-500">Download reports</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2 h-auto py-4">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Compliance Report</div>
                      <div className="text-sm text-gray-500">Generate audit</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2 h-auto py-4">
                    <Key className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">API Keys</div>
                      <div className="text-sm text-gray-500">Manage access</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2 h-auto py-4">
                    <Bell className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Alerts</div>
                      <div className="text-sm text-gray-500">Configure notifications</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Customer Management</h3>
              <p className="text-sm text-gray-600">Manage verified customers and their verification status</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input placeholder="Search customers..." className="w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Onboarded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.slice(0, 10).map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.email}</div>
                            <div className="text-sm text-gray-500 font-mono">{customer.did.slice(0, 32)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {customer.verificationLevel.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getRiskColor(customer.riskScore)}`}>
                            {customer.riskScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.onboardedAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Compliance Dashboard</h3>
            <p className="text-sm text-gray-600">Monitor compliance status and audit requirements</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{report.framework}</div>
                        <div className="text-sm text-gray-500">
                          Last audit: {report.lastAudit.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.issues.length > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            {report.issues.length} issues
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retention Period</span>
                    <span className="text-sm text-gray-600">{merchant.settings.retentionPeriod} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-deletion</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">GDPR Compliant</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Right to be Forgotten</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Supported</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Issues */}
          {complianceReports.some(r => r.issues.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Outstanding Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceReports.flatMap(r => r.issues).map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-4 w-4 mt-1 ${
                        issue.severity === 'critical' ? 'text-red-500' :
                        issue.severity === 'high' ? 'text-orange-500' :
                        issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.description}</span>
                          <Badge variant="outline" className={
                            issue.severity === 'critical' ? 'bg-red-50 text-red-700' :
                            issue.severity === 'high' ? 'bg-orange-50 text-orange-700' :
                            issue.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                          }>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.recommendation}</p>
                        {issue.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {issue.dueDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API & Webhooks Tab */}
        <TabsContent value="api" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">API Management</h3>
            <p className="text-sm text-gray-600">Monitor API usage, manage keys, and configure webhooks</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Production Key</div>
                      <div className="text-sm text-gray-500 font-mono">
                        {merchant.apiKey.slice(0, 12)}...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Verification Events</div>
                      <div className="text-sm text-gray-500">
                        {merchant.webhookUrl || 'Not configured'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                      <Button variant="outline" size="sm">
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>API Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calls
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiUsage.map((usage, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                          {usage.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {usage.calls.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={usage.successRate >= 98 ? 'text-green-600' : 'text-orange-600'}>
                            {usage.successRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {usage.avgResponseTime}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={usage.errors === 0 ? 'text-green-600' : 'text-red-600'}>
                            {usage.errors}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}