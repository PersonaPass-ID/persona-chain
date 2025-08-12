/**
 * SYSTEM MONITORING DASHBOARD
 * 
 * Real-time system monitoring dashboard for PersonaPass platform infrastructure,
 * including health metrics, performance monitoring, alerting, and incident management.
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
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  Database,
  Globe,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  BarChart3,
  PieChart,
  Monitor,
  Cloud,
  Shield,
  Key,
  Users,
  DollarSign,
  FileText,
  Download,
  AlertCircle,
  Info,
  Thermometer,
  Gauge
} from 'lucide-react'

interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical' | 'maintenance'
  uptime: number
  responseTime: number
  throughput: number
  errorRate: number
  lastUpdated: Date
}

interface ServiceHealth {
  name: string
  status: 'up' | 'down' | 'degraded' | 'maintenance'
  responseTime: number
  uptime: number
  version: string
  instances: number
  activeInstances: number
}

interface InfrastructureMetrics {
  cpu: { usage: number; cores: number; load: number[] }
  memory: { used: number; total: number; percentage: number }
  storage: { used: number; total: number; percentage: number }
  network: { inbound: number; outbound: number; connections: number }
  database: { connections: number; queries: number; lag: number }
}

interface Alert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  service: string
  timestamp: Date
  status: 'active' | 'acknowledged' | 'resolved'
  assignee?: string
}

interface Incident {
  id: string
  title: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  startTime: Date
  resolvedTime?: Date
  affectedServices: string[]
  updates: IncidentUpdate[]
}

interface IncidentUpdate {
  timestamp: Date
  status: string
  message: string
  author: string
}

export function SystemMonitoring() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [infrastructure, setInfrastructure] = useState<InfrastructureMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('1h')

  useEffect(() => {
    loadMonitoringData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadMonitoringData = async () => {
    setRefreshing(true)
    try {
      // Simulate API calls - replace with real monitoring data
      const mockSystemMetrics: SystemMetrics = {
        status: 'healthy',
        uptime: 99.97,
        responseTime: 245,
        throughput: 2456,
        errorRate: 0.03,
        lastUpdated: new Date()
      }

      const mockServices: ServiceHealth[] = [
        {
          name: 'API Gateway',
          status: 'up',
          responseTime: 120,
          uptime: 99.98,
          version: '2.1.3',
          instances: 3,
          activeInstances: 3
        },
        {
          name: 'Authentication Service',
          status: 'up',
          responseTime: 89,
          uptime: 99.95,
          version: '1.8.2',
          instances: 2,
          activeInstances: 2
        },
        {
          name: 'KYC Processing',
          status: 'degraded',
          responseTime: 1250,
          uptime: 98.7,
          version: '3.2.1',
          instances: 4,
          activeInstances: 3
        },
        {
          name: 'Blockchain Node',
          status: 'up',
          responseTime: 67,
          uptime: 99.99,
          version: '1.0.5',
          instances: 2,
          activeInstances: 2
        },
        {
          name: 'Database Cluster',
          status: 'up',
          responseTime: 45,
          uptime: 99.99,
          version: '14.9',
          instances: 3,
          activeInstances: 3
        },
        {
          name: 'File Storage',
          status: 'up',
          responseTime: 234,
          uptime: 99.95,
          version: '2.0.1',
          instances: 2,
          activeInstances: 2
        }
      ]

      const mockInfrastructure: InfrastructureMetrics = {
        cpu: {
          usage: 67.4,
          cores: 16,
          load: [0.8, 1.2, 0.9]
        },
        memory: {
          used: 12.8,
          total: 32,
          percentage: 40
        },
        storage: {
          used: 1.2,
          total: 4,
          percentage: 30
        },
        network: {
          inbound: 125.6,
          outbound: 89.3,
          connections: 1247
        },
        database: {
          connections: 45,
          queries: 2456,
          lag: 12
        }
      }

      const mockAlerts: Alert[] = [
        {
          id: 'alert_1',
          severity: 'warning',
          title: 'High Response Time',
          description: 'KYC Processing service response time exceeded 1000ms threshold',
          service: 'KYC Processing',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          status: 'active'
        },
        {
          id: 'alert_2',
          severity: 'info',
          title: 'High Memory Usage',
          description: 'Database server memory usage at 85%',
          service: 'Database Cluster',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          status: 'acknowledged',
          assignee: 'John Doe'
        }
      ]

      const mockIncidents: Incident[] = [
        {
          id: 'incident_1',
          title: 'KYC Service Performance Degradation',
          status: 'monitoring',
          severity: 'minor',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          affectedServices: ['KYC Processing'],
          updates: [
            {
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              status: 'monitoring',
              message: 'Applied scaling adjustment, monitoring performance',
              author: 'DevOps Team'
            },
            {
              timestamp: new Date(Date.now() - 90 * 60 * 1000),
              status: 'identified',
              message: 'Identified high load on KYC processing instances',
              author: 'Monitor Bot'
            }
          ]
        }
      ]

      setSystemMetrics(mockSystemMetrics)
      setServices(mockServices)
      setInfrastructure(mockInfrastructure)
      setAlerts(mockAlerts)
      setIncidents(mockIncidents)

    } catch (error) {
      console.error('Failed to load monitoring data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'up':
      case 'healthy':
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'degraded':
      case 'warning':
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800'
      case 'down':
      case 'critical':
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
      case 'investigating':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-orange-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} TB`
    return `${bytes.toFixed(1)} GB`
  }

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(2)}%`
  }

  if (!systemMetrics || !infrastructure) {
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
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time platform health and performance monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={loadMonitoringData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Alerts ({alerts.filter(a => a.status === 'active').length})
          </Button>
        </div>
      </div>

      {/* System Status Banner */}
      <Card className={`border-l-4 ${
        systemMetrics.status === 'healthy' ? 'border-l-green-500 bg-green-50' :
        systemMetrics.status === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
        systemMetrics.status === 'critical' ? 'border-l-red-500 bg-red-50' :
        'border-l-blue-500 bg-blue-50'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {systemMetrics.status === 'healthy' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : systemMetrics.status === 'warning' ? (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              ) : systemMetrics.status === 'critical' ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Settings className="h-8 w-8 text-blue-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  System Status: <span className="capitalize">{systemMetrics.status}</span>
                </h2>
                <p className="text-gray-600">All systems operational • Last updated: {systemMetrics.lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-gray-600">Uptime</p>
                <p className="font-semibold">{formatUptime(systemMetrics.uptime)}</p>
              </div>
              <div>
                <p className="text-gray-600">Response Time</p>
                <p className="font-semibold">{systemMetrics.responseTime}ms</p>
              </div>
              <div>
                <p className="text-gray-600">Throughput</p>
                <p className="font-semibold">{systemMetrics.throughput} req/s</p>
              </div>
              <div>
                <p className="text-gray-600">Error Rate</p>
                <p className="font-semibold">{systemMetrics.errorRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-green-600">
                      {services.filter(s => s.status === 'up').length}/{services.length}
                    </p>
                  </div>
                  <Server className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {alerts.filter(a => a.status === 'active').length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                    <p className="text-2xl font-bold text-red-600">
                      {incidents.filter(i => i.status !== 'resolved').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold">{infrastructure.cpu.usage}%</p>
                  </div>
                  <Cpu className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <Progress value={infrastructure.cpu.usage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{service.name}</h3>
                    <Badge variant="outline" className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span>{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uptime:</span>
                      <span>{formatUptime(service.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Instances:</span>
                      <span>{service.activeInstances}/{service.instances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span>{service.version}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Health Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instances</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              service.status === 'up' ? 'bg-green-500' :
                              service.status === 'degraded' ? 'bg-yellow-500' :
                              service.status === 'down' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(service.status)}>
                            {service.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={service.responseTime > 1000 ? 'text-red-600' : service.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'}>
                            {service.responseTime}ms
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatUptime(service.uptime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={service.activeInstances < service.instances ? 'text-yellow-600' : ''}>
                            {service.activeInstances}/{service.instances}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {service.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CPU Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Usage</span>
                    <span className="font-semibold">{infrastructure.cpu.usage}%</span>
                  </div>
                  <Progress value={infrastructure.cpu.usage} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cores</p>
                      <p className="font-semibold">{infrastructure.cpu.cores}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Load Avg</p>
                      <p className="font-semibold">{infrastructure.cpu.load.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Usage</span>
                    <span className="font-semibold">{infrastructure.memory.percentage}%</span>
                  </div>
                  <Progress value={infrastructure.memory.percentage} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Used</p>
                      <p className="font-semibold">{formatBytes(infrastructure.memory.used)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold">{formatBytes(infrastructure.memory.total)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Usage</span>
                    <span className="font-semibold">{infrastructure.storage.percentage}%</span>
                  </div>
                  <Progress value={infrastructure.storage.percentage} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Used</p>
                      <p className="font-semibold">{formatBytes(infrastructure.storage.used)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold">{formatBytes(infrastructure.storage.total)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Network Traffic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Inbound</p>
                      <p className="font-semibold">{infrastructure.network.inbound} MB/s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Outbound</p>
                      <p className="font-semibold">{infrastructure.network.outbound} MB/s</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Active Connections</p>
                    <p className="font-semibold">{infrastructure.network.connections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Connections</p>
                      <p className="font-semibold">{infrastructure.database.connections}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Queries/s</p>
                      <p className="font-semibold">{infrastructure.database.queries}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Replication Lag</p>
                    <p className="font-semibold">{infrastructure.database.lag}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Performance chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {alert.severity === 'critical' && <AlertCircle className="h-5 w-5 text-red-500" />}
                        {alert.severity === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                        {alert.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        {alert.severity === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {alert.service} • {alert.timestamp.toLocaleString()}
                          </div>
                          {alert.assignee && (
                            <div className="text-xs text-gray-500">
                              Assigned to: {alert.assignee}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-6">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{incident.title}</h3>
                          <p className="text-sm text-gray-600">
                            Started: {incident.startTime.toLocaleString()}
                            {incident.resolvedTime && ` • Resolved: ${incident.resolvedTime.toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Affected Services:</p>
                        <div className="flex gap-2">
                          {incident.affectedServices.map((service) => (
                            <Badge key={service} variant="outline">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {incident.updates.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recent Updates:</p>
                          <div className="space-y-2">
                            {incident.updates.slice(-2).map((update, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{update.status}</span>
                                  <span className="text-gray-500">
                                    {update.timestamp.toLocaleString()} • {update.author}
                                  </span>
                                </div>
                                <p>{update.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No open incidents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Gauge className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Performance metrics chart</p>
                    <p className="text-sm text-gray-500">Real-time system performance visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Resource usage breakdown</p>
                    <p className="text-sm text-gray-500">CPU, Memory, Storage utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}