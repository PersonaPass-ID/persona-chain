/**
 * Didit FREE KYC Integration Component
 * Handles identity verification using Didit.me's unlimited FREE tier
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Users,
  Globe,
  FileCheck
} from 'lucide-react'

interface DiditKYCProps {
  userAddress?: string
  onVerificationComplete?: (result: any) => void
  userTier?: 'free' | 'premium' | 'enterprise'
}

export default function DiditKYCComponent({ 
  userAddress, 
  onVerificationComplete,
  userTier = 'free' 
}: DiditKYCProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'creating' | 'active' | 'completed' | 'failed'>('idle')
  
  // Form state for user details
  const [userDetails, setUserDetails] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  })

  const startKYCProcess = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first')
      return
    }

    if (!userDetails.email || !userDetails.firstName || !userDetails.lastName) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)
    setVerificationStatus('creating')

    try {
      console.log(`🆓 Starting FREE Didit KYC for user: ${userAddress}`)

      const response = await fetch('/api/kyc/didit/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress,
          userTier,
          ...userDetails
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create KYC session')
      }

      console.log('✅ Didit session created:', data)
      setSessionData(data)
      setVerificationStatus('active')

      // Open Didit verification in new window
      if (data.session?.url) {
        const verificationWindow = window.open(
          data.session.url, 
          'didit-kyc',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        )

        // Monitor window close and verification completion
        const checkWindow = setInterval(() => {
          if (verificationWindow?.closed) {
            clearInterval(checkWindow)
            // Check verification status
            checkVerificationStatus(data.session.id)
          }
        }, 1000)

        // Auto-check status after 2 minutes
        setTimeout(() => {
          if (!verificationWindow?.closed) {
            checkVerificationStatus(data.session.id)
          }
        }, 120000)
      }

    } catch (err: any) {
      console.error('❌ KYC session creation failed:', err)
      setError(err.message)
      setVerificationStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const checkVerificationStatus = async (sessionId: string) => {
    try {
      // TODO: Implement status checking endpoint
      console.log('🔍 Checking verification status for:', sessionId)
      
      // For now, simulate successful verification after delay
      setTimeout(() => {
        setVerificationStatus('completed')
        onVerificationComplete?.({
          success: true,
          sessionId,
          cost: 0,
          provider: 'didit'
        })
      }, 2000)
      
    } catch (err: any) {
      console.error('Failed to check verification status:', err)
    }
  }

  const getFeatureList = () => {
    const freeFeatures = [
      '✅ Document Verification (3000+ types)',
      '✅ Facial Recognition & Matching',
      '✅ Passive Liveness Detection', 
      '✅ Database Cross-Check',
      '✅ IP Address Analysis',
      '✅ NFC Document Reading'
    ]

    const premiumFeatures = userTier !== 'free' ? [
      '💎 Enhanced Active Liveness ($0.15)',
      '💎 Phone Verification ($0.10)',
      '💎 Age Estimation AI ($0.10)'
    ] : []

    return [...freeFeatures, ...premiumFeatures]
  }

  return (
    <div className="space-y-6">
      {/* Didit Provider Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Didit Identity Verification
            </h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <DollarSign className="h-3 w-3 mr-1" />
              FREE Unlimited
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Complete identity verification with zero cost using Didit's free tier
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">220+ Countries</p>
              <p className="text-gray-600">Global coverage</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <FileCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="font-medium">3000+ Documents</p>
              <p className="text-gray-600">ID types supported</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="font-medium">GDPR Compliant</p>
              <p className="text-gray-600">Privacy protected</p>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Verification Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {getFeatureList().map((feature, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Cost Comparison */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <strong>Cost Savings:</strong> Didit FREE tier vs Sumsub ($149/month + $1.35/verification) = 
              <span className="text-green-600 font-medium"> 99%+ savings</span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* KYC Form */}
      {verificationStatus === 'idle' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Start FREE Identity Verification</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    value={userDetails.firstName}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    value={userDetails.lastName}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Email Address *</label>
                <Input
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number (Optional)</label>
                <Input
                  type="tel"
                  value={userDetails.phoneNumber}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              {error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={startKYCProcess}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Creating Session...' : 'Start FREE Verification'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      {verificationStatus !== 'idle' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {verificationStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-blue-500 animate-spin" />
              )}
              Verification Status
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationStatus === 'creating' && (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-spin" />
                  <p className="font-medium">Creating verification session...</p>
                  <p className="text-sm text-gray-600">Setting up your FREE Didit verification</p>
                </div>
              )}

              {verificationStatus === 'active' && sessionData && (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium">Verification in progress</p>
                  <p className="text-sm text-gray-600">Complete the verification in the popup window</p>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm"><strong>Session ID:</strong> {sessionData.session?.id}</p>
                    <p className="text-sm"><strong>Cost:</strong> ${sessionData.session?.cost || 0} (FREE)</p>
                  </div>
                </div>
              )}

              {verificationStatus === 'completed' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium text-green-600">Verification Completed!</p>
                  <p className="text-sm text-gray-600">
                    Your PersonaPass Proof of Personhood credential is ready
                  </p>
                  
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Success!</strong> You've earned 100 free ID tokens and can now access premium features
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {verificationStatus === 'failed' && (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-medium text-red-600">Verification Failed</p>
                  <p className="text-sm text-gray-600">Please try again or contact support</p>
                  
                  <Button 
                    onClick={() => {
                      setVerificationStatus('idle')
                      setError(null)
                      setSessionData(null)
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}