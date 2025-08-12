/**
 * USER MANAGEMENT DASHBOARD
 * 
 * Administrative dashboard for managing user accounts, roles, permissions,
 * user analytics, and account lifecycle management.
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
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Key, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Lock,
  Unlock,
  Crown,
  Star,
  Clock,
  Globe,
  CreditCard,
  FileText,
  MoreHorizontal
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  did?: string
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'blocked'
  role: 'user' | 'admin' | 'moderator' | 'enterprise' | 'premium'
  tier: 'basic' | 'professional' | 'enterprise'
  verificationLevel: 'none' | 'tier1' | 'tier2' | 'tier3'
  createdAt: Date
  lastLogin: Date
  lastActivity: Date
  country: string
  phoneNumber?: string
  kycStatus: 'not_started' | 'in_progress' | 'verified' | 'rejected'
  riskScore: number
  totalSpent: number
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'expired'
  permissions: string[]
}

interface UserStats {
  total: number
  active: number
  inactive: number
  suspended: number
  newToday: number
  newThisWeek: number
  verified: number
  premium: number
}

interface Activity {
  id: string
  userId: string
  action: string
  details: string
  timestamp: Date
  ipAddress: string
  userAgent: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    tier: 'all',
    country: 'all',
    kycStatus: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [showCreateUser, setShowCreateUser] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [filters])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Simulate API calls - replace with real implementation
      const mockStats: UserStats = {
        total: 125847,
        active: 98234,
        inactive: 21456,
        suspended: 6157,
        newToday: 342,
        newThisWeek: 2456,
        verified: 87234,
        premium: 15632
      }

      const mockUsers: User[] = Array.from({ length: 100 }, (_, i) => ({
        id: `user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        firstName: ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa'][Math.floor(Math.random() * 6)],
        lastName: ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller'][Math.floor(Math.random() * 6)],
        did: Math.random() > 0.3 ? `did:persona:mainnet:${Math.random().toString(36).substr(2, 16)}` : undefined,
        status: ['active', 'inactive', 'suspended', 'pending', 'blocked'][Math.floor(Math.random() * 5)] as any,
        role: ['user', 'admin', 'moderator', 'enterprise', 'premium'][Math.floor(Math.random() * 5)] as any,
        tier: ['basic', 'professional', 'enterprise'][Math.floor(Math.random() * 3)] as any,
        verificationLevel: ['none', 'tier1', 'tier2', 'tier3'][Math.floor(Math.random() * 4)] as any,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        country: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'][Math.floor(Math.random() * 10)],
        phoneNumber: Math.random() > 0.4 ? `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        kycStatus: ['not_started', 'in_progress', 'verified', 'rejected'][Math.floor(Math.random() * 4)] as any,
        riskScore: Math.floor(Math.random() * 100),
        totalSpent: Math.random() * 5000,
        subscriptionStatus: ['none', 'active', 'cancelled', 'expired'][Math.floor(Math.random() * 4)] as any,
        permissions: ['read', 'write', 'delete'].filter(() => Math.random() > 0.5)
      }))

      const mockActivities: Activity[] = Array.from({ length: 50 }, (_, i) => ({
        id: `activity_${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 100) + 1}`,
        action: ['login', 'logout', 'profile_update', 'kyc_submit', 'payment', 'verification'][Math.floor(Math.random() * 6)],
        details: 'Activity details here',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }))

      setStats(mockStats)
      setUsers(mockUsers)
      setActivities(mockActivities)
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'moderator': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-indigo-100 text-indigo-800'
      case 'premium': return 'bg-yellow-100 text-yellow-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'block' | 'delete' | 'reset_password') => {
    try {
      // API call to perform user action
      console.log(`${action} user ${userId}`)
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              status: action === 'activate' ? 'active' : 
                     action === 'suspend' ? 'suspended' : 
                     action === 'block' ? 'blocked' : u.status
            }
          : u
      ))
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  const filteredUsers = users.filter(u => {
    if (filters.status !== 'all' && u.status !== filters.status) return false
    if (filters.role !== 'all' && u.role !== filters.role) return false
    if (filters.tier !== 'all' && u.tier !== filters.tier) return false
    if (filters.country !== 'all' && u.country !== filters.country) return false
    if (filters.kycStatus !== 'all' && u.kycStatus !== filters.kycStatus) return false
    if (searchTerm && !u.email.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !u.lastName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (loading || !stats) {
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUserData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateUser(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">+{stats.newToday} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{((stats.active / stats.total) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.verified.toLocaleString()}</p>
              </div>
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{((stats.verified / stats.total) * 100).toFixed(1)}% verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.premium.toLocaleString()}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{((stats.premium / stats.total) * 100).toFixed(1)}% premium</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="user-detail">User Details</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.kycStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, kycStatus: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All KYC Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline" className="ml-auto">
                  {filteredUsers.length} users
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.slice(0, 20).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.did && (
                                <div className="text-xs text-gray-400 font-mono">{user.did.slice(0, 32)}...</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(user.kycStatus)}>
                            {user.kycStatus.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getRiskColor(user.riskScore)}`}>
                            {user.riskScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select>
                              <SelectTrigger className="w-8 h-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="edit">Edit</SelectItem>
                                <SelectItem value="suspend">Suspend</SelectItem>
                                <SelectItem value="block">Block</SelectItem>
                                <SelectItem value="delete">Delete</SelectItem>
                              </SelectContent>
                            </Select>
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

        {/* User Detail Tab */}
        <TabsContent value="user-detail" className="space-y-6">
          {selectedUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <p className="text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Status</p>
                        <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Role</p>
                        <Badge variant="outline" className={getRoleColor(selectedUser.role)}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Tier</p>
                        <p className="font-semibold">{selectedUser.tier}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Verification Level</p>
                        <p className="font-semibold">{selectedUser.verificationLevel.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    {selectedUser.did && (
                      <div>
                        <p className="text-gray-600 text-sm">Decentralized ID</p>
                        <p className="font-mono text-sm break-all">{selectedUser.did}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-semibold">{selectedUser.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Login</p>
                        <p className="font-semibold">{selectedUser.lastLogin.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Country</p>
                        <p className="font-semibold">{selectedUser.country}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-semibold">{selectedUser.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Risk Score</p>
                        <p className={`font-semibold ${getRiskColor(selectedUser.riskScore)}`}>
                          {selectedUser.riskScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Spent</p>
                        <p className="font-semibold">${selectedUser.totalSpent.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    KYC Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">KYC Status</span>
                      <Badge variant="outline" className={getStatusColor(selectedUser.kycStatus)}>
                        {selectedUser.kycStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification Level</span>
                      <span className="text-sm">{selectedUser.verificationLevel.toUpperCase()}</span>
                    </div>
                    {selectedUser.kycStatus === 'verified' && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">Identity verified</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                        <Edit className="h-4 w-4" />
                        <span className="text-xs">Edit Profile</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                        <Key className="h-4 w-4" />
                        <span className="text-xs">Reset Password</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedUser.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          className="h-auto py-3 flex-col gap-1 text-orange-600 hover:text-orange-700"
                          onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                        >
                          <Ban className="h-4 w-4" />
                          <span className="text-xs">Suspend</span>
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="h-auto py-3 flex-col gap-1 text-green-600 hover:text-green-700"
                          onClick={() => handleUserAction(selectedUser.id, 'activate')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Activate</span>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1 text-red-600 hover:text-red-700"
                        onClick={() => handleUserAction(selectedUser.id, 'block')}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Block</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a user to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: 'Admin', count: 5, color: 'bg-purple-100 text-purple-800', permissions: ['All permissions'] },
                    { role: 'Moderator', count: 23, color: 'bg-blue-100 text-blue-800', permissions: ['User management', 'Content moderation'] },
                    { role: 'Enterprise', count: 1247, color: 'bg-indigo-100 text-indigo-800', permissions: ['Advanced features', 'API access'] },
                    { role: 'Premium', count: 15632, color: 'bg-yellow-100 text-yellow-800', permissions: ['Premium features'] },
                    { role: 'User', count: 108940, color: 'bg-gray-100 text-gray-800', permissions: ['Basic features'] }
                  ].map((roleData) => (
                    <div key={roleData.role} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={roleData.color}>
                            {roleData.role}
                          </Badge>
                          <span className="text-sm text-gray-600">{roleData.count} users</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {roleData.permissions.join(', ')}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Permission Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    'User Management',
                    'KYC Administration',
                    'Financial Operations',
                    'System Configuration',
                    'Analytics & Reporting',
                    'API Access'
                  ].map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{permission}</span>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.action === 'login' && <Clock className="h-4 w-4 text-green-500" />}
                      {activity.action === 'logout' && <Clock className="h-4 w-4 text-gray-500" />}
                      {activity.action === 'profile_update' && <Edit className="h-4 w-4 text-blue-500" />}
                      {activity.action === 'kyc_submit' && <Shield className="h-4 w-4 text-purple-500" />}
                      {activity.action === 'payment' && <CreditCard className="h-4 w-4 text-green-500" />}
                      {activity.action === 'verification' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activity.action.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{activity.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{activity.timestamp.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{activity.ipAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">User growth chart</p>
                    <p className="text-sm text-gray-500">Registration trends over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Geographic distribution</p>
                    <p className="text-sm text-gray-500">Users by country and region</p>
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