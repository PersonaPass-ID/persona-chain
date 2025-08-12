'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheck, 
  Wallet, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  Lock
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { ZKAgeVerification } from '@/lib/zk-age-verification'
import { motion } from 'framer-motion'

interface VerificationSession {
  id: string
  status: string
  minimum_age: number
  expires_at: string
  redirect_url?: string
}

export default function VerifyPage() {
  const params = useParams()
  const router = useRouter()
  const { connect, address, isConnected } = useWallet()
  
  const [session, setSession] = useState<VerificationSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionId = params.sessionId as string

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/v1/verification/sessions/${sessionId}`)
      if (!response.ok) {
        throw new Error('Session not found')
      }
      const data = await response.json()
      setSession(data)
    } catch (error) {
      setError('Invalid verification session')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async () => {
    if (!isConnected || !address) {
      await connect()
      return
    }

    setVerifying(true)
    setError(null)

    try {
      // Generate ZK proof of age
      const zkVerification = new ZKAgeVerification()
      
      // In production, this would get the birthdate from the user's DID
      // For demo, we'll use a mock birthdate
      const proof = await zkVerification.generateAgeProof({
        birthdate: '1990-01-01', // Mock - would come from DID
        currentDate: new Date().toISOString(),
        minimumAge: session!.minimum_age
      })

      // Submit proof to API
      const response = await fetch(`/api/v1/verification/sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proof,
          walletAddress: address
        })
      })

      if (!response.ok) {
        throw new Error('Verification failed')
      }

      const result = await response.json()
      
      if (result.verified) {
        setVerified(true)
        
        // Redirect after 2 seconds if URL provided
        if (session?.redirect_url) {
          setTimeout(() => {
            window.location.href = session.redirect_url!
          }, 2000)
        }
      } else {
        throw new Error('Age verification failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-red-500/20">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Session</h2>
            <p className="text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full bg-gray-900 border-green-500/20">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Age Verified!</h2>
              <p className="text-gray-400 mb-4">
                You have successfully verified you are over {session?.minimum_age} years old.
              </p>
              {session?.redirect_url && (
                <p className="text-sm text-gray-500">
                  Redirecting you back to the store...
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-900 border-indigo-500/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-indigo-500" />
          </div>
          <CardTitle className="text-2xl">Age Verification Required</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                This merchant requires you to be at least
              </p>
              <Badge variant="secondary" className="text-2xl py-2 px-4">
                {session?.minimum_age}+ years old
              </Badge>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" />
                Privacy Guaranteed
              </h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• No personal data is shared</li>
                <li>• Zero-knowledge proof technology</li>
                <li>• One-click verification</li>
                <li>• No documents required</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              onClick={handleVerification}
              disabled={verifying}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isConnected ? (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify My Age
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet to Verify
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Powered by PersonaPass • Your Identity, Your Control
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}