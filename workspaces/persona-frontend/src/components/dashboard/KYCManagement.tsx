/**
 * KYC MANAGEMENT DASHBOARD
 * 
 * Administrative dashboard for managing KYC processes, reviewing verifications,
 * compliance monitoring, and manual review workflows.
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
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  FileText, 
  User,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Ban,
  UserCheck,
  AlertCircle,
  Flag,
  Camera,
  Fingerprint,
  CreditCard,
  Building,
  Globe,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  XCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

interface KYCCase {
  id: string
  userId: string
  userEmail: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_action' | 'escalated'
  level: 'tier1' | 'tier2' | 'tier3'
  provider: string
  submittedAt: Date
  reviewedAt?: Date
  reviewer?: string
  riskScore: number
  documents: Document[]
  flags: Flag[]
  notes: Note[]
}

interface Document {
  id: string
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement' | 'selfie'
  status: 'pending' | 'verified' | 'rejected'
  url: string
  extractedData?: any
  confidence: number
}

interface Flag {
  type: 'document_quality' | 'identity_mismatch' | 'sanctions_check' | 'fraud_indicator' | 'technical_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  automaticFlag: boolean
}

interface Note {
  id: string
  author: string
  content: string
  timestamp: Date
  type: 'reviewer_note' | 'system_note' | 'user_communication'
}

interface KYCStats {
  total: number
  pending: number
  inReview: number
  approved: number
  rejected: number
  avgReviewTime: number
  todaySubmissions: number
  escalated: number
}

export function KYCManagement() {
  const [cases, setCases] = useState<KYCCase[]>([])
  const [selectedCase, setSelectedCase] = useState<KYCCase | null>(null)
  const [stats, setStats] = useState<KYCStats | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    provider: 'all',
    riskLevel: 'all',
    dateRange: '7d'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('queue')

  useEffect(() => {
    loadKYCData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadKYCData, 30000)
    return () => clearInterval(interval)
  }, [filters])

  const loadKYCData = async () => {
    setLoading(true)
    try {
      // Simulate API calls - replace with real implementation
      const mockStats: KYCStats = {
        total: 2456,
        pending: 234,
        inReview: 89,
        approved: 1895,
        rejected: 238,
        avgReviewTime: 6.7,
        todaySubmissions: 67,
        escalated: 12
      }

      const mockCases: KYCCase[] = Array.from({ length: 50 }, (_, i) => ({
        id: `kyc_${i + 1}`,
        userId: `user_${i + 1}`,
        userEmail: `user${i + 1}@example.com`,
        status: ['pending', 'in_review', 'approved', 'rejected', 'requires_action', 'escalated'][Math.floor(Math.random() * 6)] as any,
        level: ['tier1', 'tier2', 'tier3'][Math.floor(Math.random() * 3)] as any,
        provider: ['Sumsub', 'Plaid', 'Onfido', 'Internal'][Math.floor(Math.random() * 4)],
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        reviewedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
        reviewer: Math.random() > 0.5 ? ['John Doe', 'Jane Smith', 'Mike Wilson'][Math.floor(Math.random() * 3)] : undefined,
        riskScore: Math.floor(Math.random() * 100),
        documents: [
          {
            id: `doc_${i}_1`,
            type: 'drivers_license',
            status: 'verified',
            url: '/placeholder-doc.pdf',
            confidence: 95 + Math.random() * 5
          },
          {
            id: `doc_${i}_2`,
            type: 'selfie',
            status: 'verified',
            url: '/placeholder-selfie.jpg',
            confidence: 90 + Math.random() * 10
          }
        ],
        flags: Math.random() > 0.7 ? [
          {
            type: 'document_quality',
            severity: 'medium',
            description: 'Document image quality below optimal threshold',
            automaticFlag: true
          }
        ] : [],
        notes: []
      }))

      setStats(mockStats)
      setCases(mockCases)
    } catch (error) {
      console.error('Failed to load KYC data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'requires_action': return 'bg-orange-100 text-orange-800'
      case 'escalated': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const handleCaseAction = async (caseId: string, action: 'approve' | 'reject' | 'request_more' | 'escalate', note?: string) => {
    try {
      // API call to update case status
      console.log(`${action} case ${caseId}`, note)
      
      // Update local state
      setCases(prev => prev.map(c => 
        c.id === caseId 
          ? { 
              ...c, 
              status: action === 'approve' ? 'approved' : 
                     action === 'reject' ? 'rejected' : 
                     action === 'request_more' ? 'requires_action' : 'escalated',
              reviewedAt: new Date(),
              reviewer: 'Current User', // Would come from auth
              notes: note ? [...c.notes, {
                id: `note_${Date.now()}`,
                author: 'Current User',
                content: note,
                timestamp: new Date(),
                type: 'reviewer_note'
              }] : c.notes
            }
          : c
      ))
      
      if (selectedCase?.id === caseId) {
        setSelectedCase(prev => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null)
      }
    } catch (error) {
      console.error('Failed to update case:', error)
    }
  }

  const filteredCases = cases.filter(c => {
    if (filters.status !== 'all' && c.status !== filters.status) return false
    if (filters.provider !== 'all' && c.provider !== filters.provider) return false
    if (searchTerm && !c.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) && !c.id.includes(searchTerm)) return false
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
          <h1 className="text-3xl font-bold">KYC Management</h1>
          <p className="text-gray-600">Review and manage identity verification cases</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadKYCData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inReview}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-purple-600">{stats.escalated}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                <p className="text-2xl font-bold">{stats.avgReviewTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="case-detail">Case Details</TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Review Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by email or case ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="requires_action">Requires Action</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.provider} onValueChange={(value) => setFilters(prev => ({ ...prev, provider: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="Sumsub">Sumsub</SelectItem>
                    <SelectItem value="Plaid">Plaid</SelectItem>
                    <SelectItem value="Onfido">Onfido</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline" className="ml-auto">
                  {filteredCases.length} cases
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cases List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCases.slice(0, 20).map((kycCase) => (
                      <tr key={kycCase.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{kycCase.id}</div>
                            {kycCase.flags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Flag className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-orange-600">{kycCase.flags.length} flags</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{kycCase.userEmail}</div>
                            <div className="text-sm text-gray-500">{kycCase.userId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(kycCase.status)}>
                            {kycCase.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {kycCase.level.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getRiskColor(kycCase.riskScore)}`}>
                            {kycCase.riskScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kycCase.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {kycCase.submittedAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCase(kycCase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(kycCase.status === 'pending' || kycCase.status === 'in_review') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleCaseAction(kycCase.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleCaseAction(kycCase.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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

        {/* Case Detail Tab */}
        <TabsContent value="case-detail" className="space-y-6">
          {selectedCase ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Case Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Case Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Case ID:</span>
                      <span className="text-sm text-gray-600">{selectedCase.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User:</span>
                      <span className="text-sm text-gray-600">{selectedCase.userEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedCase.status)}>
                        {selectedCase.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification Level:</span>
                      <Badge variant="outline">{selectedCase.level.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Score:</span>
                      <span className={`text-sm font-medium ${getRiskColor(selectedCase.riskScore)}`}>
                        {selectedCase.riskScore}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Provider:</span>
                      <span className="text-sm text-gray-600">{selectedCase.provider}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Submitted:</span>
                      <span className="text-sm text-gray-600">
                        {selectedCase.submittedAt.toLocaleDateString()} {selectedCase.submittedAt.toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedCase.reviewedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Reviewed:</span>
                        <span className="text-sm text-gray-600">
                          {selectedCase.reviewedAt.toLocaleDateString()} by {selectedCase.reviewer}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCase.documents.map((doc, index) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {doc.type === 'selfie' ? <Camera className="h-5 w-5 text-blue-600" /> :
                             doc.type === 'drivers_license' || doc.type === 'national_id' || doc.type === 'passport' ? 
                             <CreditCard className="h-5 w-5 text-blue-600" /> :
                             <FileText className="h-5 w-5 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{doc.type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">Confidence: {doc.confidence.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Flags */}
              {selectedCase.flags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-orange-500" />
                      Flags & Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCase.flags.map((flag, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <AlertTriangle className={`h-5 w-5 mt-1 ${getSeverityColor(flag.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{flag.type.replace('_', ' ')}</span>
                              <Badge variant="outline" className={getSeverityColor(flag.severity)}>
                                {flag.severity}
                              </Badge>
                              {flag.automaticFlag && (
                                <Badge variant="outline">Auto</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{flag.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {(selectedCase.status === 'pending' || selectedCase.status === 'in_review') ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          className="flex items-center gap-2"
                          onClick={() => handleCaseAction(selectedCase.id, 'approve')}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                          onClick={() => handleCaseAction(selectedCase.id, 'reject')}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleCaseAction(selectedCase.id, 'request_more')}
                        >
                          Request More Info
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCaseAction(selectedCase.id, 'escalate')}
                        >
                          Escalate
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor="review-note">Review Note</Label>
                        <Textarea
                          id="review-note"
                          placeholder="Add a note for this review..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Case has been reviewed</p>
                      <p className="text-sm text-gray-500">Status: {selectedCase.status}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a case from the queue to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bulk Actions Tab */}
        <TabsContent value="bulk-actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>Perform actions on multiple KYC cases at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export Selected</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <CheckCircle className="h-6 w-6" />
                    <span>Bulk Approve</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <XCircle className="h-6 w-6" />
                    <span>Bulk Reject</span>
                  </Button>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Bulk Action Warning</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Bulk actions affect multiple cases at once. Please review selected cases carefully before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KYC Settings</CardTitle>
              <CardDescription>Configure KYC review parameters and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Auto-approval Risk Threshold</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 (Very Conservative)</SelectItem>
                        <SelectItem value="30">30 (Conservative)</SelectItem>
                        <SelectItem value="50">50 (Moderate)</SelectItem>
                        <SelectItem value="70">70 (Liberal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Manual Review Threshold</Label>
                    <Select defaultValue="60">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="70">70</SelectItem>
                        <SelectItem value="80">80</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Automatic Processing</h4>
                    <p className="text-sm text-gray-600">Low-risk cases will be processed automatically</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications for escalated cases</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}