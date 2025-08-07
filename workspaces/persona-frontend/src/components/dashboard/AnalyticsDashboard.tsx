/**
 * ANALYTICS DASHBOARD
 * 
 * Comprehensive analytics dashboard for PersonaPass platform with real-time metrics,
 * verification analytics, compliance monitoring, and business intelligence.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Shield, 
  DollarSign,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  MapPin,
  CreditCard,
  Zap,
  Eye,
  UserCheck,
  Ban
} from 'lucide-react'

interface AnalyticsData {
  overview: OverviewMetrics
  verifications: VerificationMetrics
  geographical: GeographicalData
  compliance: ComplianceMetrics
  revenue: RevenueMetrics
  performance: PerformanceMetrics
}

interface OverviewMetrics {
  totalUsers: number
  activeUsers: number
  newSignups: number
  verifiedUsers: number
  growthRate: number
  churnRate: number
}

interface VerificationMetrics {
  totalAttempts: number
  successRate: number
  avgProcessingTime: number
  byLevel: { [key: string]: number }
  byProvider: { [key: string]: number }
  fraudDetected: number
  manualReviews: number
}

interface GeographicalData {
  countries: Array<{
    code: string
    name: string
    users: number
    verifications: number
    revenue: number
  }>
  regions: { [key: string]: number }
}

interface ComplianceMetrics {
  gdprRequests: number
  ccpaRequests: number
  dataRetentionCompliance: number
  auditScore: number
  violations: ComplianceViolation[]
}

interface ComplianceViolation {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
}

interface RevenueMetrics {
  totalRevenue: number
  monthlyRecurring: number
  avgRevenuePerUser: number
  conversionRate: number
  churnRevenue: number
  byTier: { [key: string]: number }
}

interface PerformanceMetrics {
  apiLatency: number
  uptime: number
  errorRate: number
  throughput: number
  systemLoad: number
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalyticsData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setRefreshing(true)
    try {
      // Simulate API call - replace with actual implementation
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 125847,
          activeUsers: 89234,
          newSignups: 1247,
          verifiedUsers: 95621,
          growthRate: 12.3,
          churnRate: 2.1
        },
        verifications: {
          totalAttempts: 156982,
          successRate: 87.4,
          avgProcessingTime: 4.2,
          byLevel: {
            'Tier 1': 45678,
            'Tier 2': 78234,
            'Tier 3': 33070
          },
          byProvider: {
            'Sumsub': 89234,
            'Plaid': 45678,
            'Onfido': 22070
          },
          fraudDetected: 1247,
          manualReviews: 3421
        },
        geographical: {
          countries: [
            { code: 'US', name: 'United States', users: 45678, verifications: 52341, revenue: 234567 },
            { code: 'GB', name: 'United Kingdom', users: 23456, verifications: 26789, revenue: 123456 },
            { code: 'CA', name: 'Canada', users: 12345, verifications: 14567, revenue: 67890 },
            { code: 'AU', name: 'Australia', users: 8901, verifications: 10234, revenue: 45678 }
          ],
          regions: {
            'North America': 58023,
            'Europe': 34567,
            'Asia Pacific': 20456,
            'Rest of World': 12801
          }
        },
        compliance: {
          gdprRequests: 234,
          ccpaRequests: 156,
          dataRetentionCompliance: 98.7,
          auditScore: 94.2,
          violations: [
            { type: 'Data Retention', severity: 'medium', count: 3 },
            { type: 'Access Control', severity: 'low', count: 7 }
          ]
        },
        revenue: {
          totalRevenue: 1234567,
          monthlyRecurring: 456789,
          avgRevenuePerUser: 9.87,
          conversionRate: 3.4,
          churnRevenue: 12345,
          byTier: {
            'Basic': 123456,
            'Professional': 567890,
            'Enterprise': 543221
          }
        },
        performance: {
          apiLatency: 245,
          uptime: 99.97,
          errorRate: 0.03,
          throughput: 2456,
          systemLoad: 67.4
        }
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (value: number, threshold: number, inverse = false): string => {
    if (inverse) {
      return value <= threshold ? 'text-green-600' : 'text-red-600'
    }
    return value >= threshold ? 'text-green-600' : 'text-red-600'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!analyticsData) {
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
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={loadAnalyticsData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalUsers)}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{analyticsData.overview.growthRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.activeUsers)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(analyticsData.overview.activeUsers / analyticsData.overview.totalUsers) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified Users</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.verifiedUsers)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    {((analyticsData.overview.verifiedUsers / analyticsData.overview.totalUsers) * 100).toFixed(1)}% verified
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Signups</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.newSignups)}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-500" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">-{analyticsData.overview.churnRate}% churn</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chart visualization would be implemented here</p>
                    <p className="text-sm text-gray-500">Using Chart.js, Recharts, or D3.js</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Verification Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.verifications.byLevel).map(([level, count]) => {
                    const percentage = (count / analyticsData.verifications.totalAttempts) * 100
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{level}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNumber(count)}</p>
                          <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.verifications.successRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <Progress value={analyticsData.verifications.successRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                    <p className="text-2xl font-bold">{analyticsData.verifications.avgProcessingTime}min</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${getStatusColor(analyticsData.verifications.avgProcessingTime, 5, true)}`}>
                    Target: &lt;5min
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fraud Detected</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.verifications.fraudDetected)}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-500" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-red-600">
                    {((analyticsData.verifications.fraudDetected / analyticsData.verifications.totalAttempts) * 100).toFixed(2)}% fraud rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Manual Reviews</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.verifications.manualReviews)}</p>
                  </div>
                  <Eye className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-yellow-600">
                    {((analyticsData.verifications.manualReviews / analyticsData.verifications.totalAttempts) * 100).toFixed(1)}% manual
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Provider Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.verifications.byProvider).map(([provider, count]) => {
                  const percentage = (count / analyticsData.verifications.totalAttempts) * 100
                  return (
                    <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{provider}</h4>
                        <p className="text-sm text-gray-600">{formatNumber(count)} verifications</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.geographical.countries.map((country, index) => (
                    <div key={country.code} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{country.name}</h4>
                          <p className="text-sm text-gray-600">{formatNumber(country.users)} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(country.revenue)}</p>
                        <p className="text-sm text-gray-600">{formatNumber(country.verifications)} verifications</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.geographical.regions).map(([region, users]) => {
                    const total = Object.values(analyticsData.geographical.regions).reduce((a, b) => a + b, 0)
                    const percentage = (users / total) * 100
                    return (
                      <div key={region} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{region}</span>
                          <span className="text-gray-600">{formatNumber(users)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">GDPR Requests</p>
                    <p className="text-2xl font-bold">{analyticsData.compliance.gdprRequests}</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">CCPA Requests</p>
                    <p className="text-2xl font-bold">{analyticsData.compliance.ccpaRequests}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retention Compliance</p>
                    <p className="text-2xl font-bold">{analyticsData.compliance.dataRetentionCompliance}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <Progress value={analyticsData.compliance.dataRetentionCompliance} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Audit Score</p>
                    <p className="text-2xl font-bold">{analyticsData.compliance.auditScore}/100</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${getStatusColor(analyticsData.compliance.auditScore, 90)}`}>
                    {analyticsData.compliance.auditScore >= 90 ? 'Excellent' : 'Needs improvement'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Violations */}
          {analyticsData.compliance.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Compliance Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.compliance.violations.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          violation.severity === 'critical' ? 'text-red-500' :
                          violation.severity === 'high' ? 'text-orange-500' :
                          violation.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{violation.type}</h4>
                          <p className="text-sm text-gray-600">{violation.count} incidents</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-green-600 mt-2">+15.3% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Recurring</p>
                    <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.monthlyRecurring)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  {((analyticsData.revenue.monthlyRecurring / analyticsData.revenue.totalRevenue) * 100).toFixed(1)}% recurring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ARPU</p>
                    <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.avgRevenuePerUser)}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Average Revenue Per User</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.revenue.conversionRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <Progress value={analyticsData.revenue.conversionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Tier */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.revenue.byTier).map(([tier, revenue]) => {
                  const percentage = (revenue / analyticsData.revenue.totalRevenue) * 100
                  return (
                    <div key={tier} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{tier}</span>
                        <span className="text-gray-600">{formatCurrency(revenue)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Latency</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.apiLatency}ms</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${getStatusColor(analyticsData.performance.apiLatency, 300, true)}`}>
                    Target: &lt;300ms
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.uptime}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <Progress value={analyticsData.performance.uptime} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.errorRate}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${getStatusColor(analyticsData.performance.errorRate, 1, true)}`}>
                    Target: &lt;1%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Throughput</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.performance.throughput)}/s</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Requests per second</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Load</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.systemLoad}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <Progress value={analyticsData.performance.systemLoad} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>System Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Performance metrics chart</p>
                  <p className="text-sm text-gray-500">Real-time performance monitoring visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}