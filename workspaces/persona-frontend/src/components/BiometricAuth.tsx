'use client'

import { useEffect, useState } from 'react'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Fingerprint, 
  Shield, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2,
  UserCheck,
  Loader2,
  Info,
  Security,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import type { BiometricCredential } from '@/lib/webauthn/webauthn-service'

interface BiometricAuthProps {
  walletAddress: string
  userId: string
  onAuthenticationSuccess?: (result: any) => void
  onRegistrationSuccess?: (credential: BiometricCredential) => void
}

export function BiometricAuth({ 
  walletAddress, 
  userId, 
  onAuthenticationSuccess,
  onRegistrationSuccess 
}: BiometricAuthProps) {
  const {
    isSupported,
    isRegistering,
    isAuthenticating,
    credentials,
    error,
    lastAuthentication,
    platformAuthenticatorAvailable,
    conditionalMediationAvailable,
    register,
    authenticate,
    loadCredentials,
    removeCredential,
    clearError,
    getCredentialSecurityInfo
  } = useWebAuthn()

  const [friendlyName, setFriendlyName] = useState('')
  const [authenticatorAttachment, setAuthenticatorAttachment] = useState<'platform' | 'cross-platform'>('platform')
  const [userVerification, setUserVerification] = useState<'required' | 'preferred' | 'discouraged'>('preferred')
  const [attestation, setAttestation] = useState<'none' | 'indirect' | 'direct'>('direct')

  // Load credentials on mount
  useEffect(() => {
    if (isSupported && walletAddress) {
      loadCredentials(walletAddress)
    }
  }, [isSupported, walletAddress, loadCredentials])

  // Handle registration
  const handleRegister = async () => {
    if (!friendlyName.trim()) {
      return
    }

    const result = await register(userId, walletAddress, friendlyName, {
      authenticatorSelection: {
        authenticatorAttachment,
        userVerification,
        requireResidentKey: false
      },
      attestation
    })

    if (result.success && result.credential) {
      setFriendlyName('')
      onRegistrationSuccess?.(result.credential)
    }
  }

  // Handle authentication
  const handleAuthenticate = async (credentialIds?: string[]) => {
    const result = await authenticate(walletAddress, {
      userVerification,
      allowCredentials: credentialIds
    })

    if (result.success) {
      onAuthenticationSuccess?.(result)
    }
  }

  // Handle credential removal
  const handleRemoveCredential = async (credentialId: string) => {
    const success = await removeCredential(walletAddress, credentialId)
    if (success) {
      console.log('Credential removed successfully')
    }
  }

  // Get security level color
  const getSecurityLevelColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-green-400 border-green-500'
      case 'medium': return 'text-yellow-400 border-yellow-500'
      case 'low': return 'text-red-400 border-red-500'
    }
  }

  // Get authenticator icon
  const getAuthenticatorIcon = (credential: BiometricCredential) => {
    if (credential.authenticatorType === 'platform') {
      return <Smartphone className="h-4 w-4" />
    }
    return <Key className="h-4 w-4" />
  }

  if (!isSupported) {
    return (
      <Card className="bg-gradient-to-br from-red-900/10 to-orange-900/10 border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            WebAuthn Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support WebAuthn/FIDO2 biometric authentication. 
            Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Capabilities Overview */}
      <Card className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Security className="h-5 w-5 text-blue-400" />
            Biometric Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Platform Auth</span>
              <Badge variant={platformAuthenticatorAvailable ? 'success' : 'secondary'}>
                {platformAuthenticatorAvailable ? 'Available' : 'Not Available'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-sm">Conditional UI</span>
              <Badge variant={conditionalMediationAvailable ? 'success' : 'secondary'}>
                {conditionalMediationAvailable ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Credentials */}
      {credentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-green-400" />
                Registered Credentials ({credentials.length})
              </span>
              <Button
                onClick={() => handleAuthenticate()}
                disabled={isAuthenticating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Authenticate
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {credentials.map((credential) => {
              const securityInfo = getCredentialSecurityInfo(credential)
              return (
                <div key={credential.credentialId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAuthenticatorIcon(credential)}
                      <span className="font-medium">{credential.friendlyName}</span>
                      <Badge 
                        variant="outline" 
                        className={getSecurityLevelColor(securityInfo.securityLevel)}
                      >
                        {securityInfo.securityLevel.toUpperCase()} SECURITY
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAuthenticate([credential.credentialId])}
                        disabled={isAuthenticating}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCredential(credential.credentialId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2">{credential.authenticatorType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2">{formatDistanceToNow(new Date(credential.createdAt))} ago</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="ml-2">{formatDistanceToNow(new Date(credential.lastUsed))} ago</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Backup:</span>
                      <span className="ml-2">{credential.backupEligible ? 'Eligible' : 'Not Eligible'}</span>
                    </div>
                  </div>

                  {/* Security Factors */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Security Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {securityInfo.factors.map((factor, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {securityInfo.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Recommendations:</div>
                      <ul className="text-xs space-y-1">
                        {securityInfo.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2 text-yellow-400">
                            <Info className="h-3 w-3" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            Register New Biometric Credential
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friendlyName">Credential Name</Label>
            <Input
              id="friendlyName"
              placeholder="e.g., iPhone TouchID, YubiKey 5C"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Authenticator Type</Label>
              <Select value={authenticatorAttachment} onValueChange={(value: 'platform' | 'cross-platform') => setAuthenticatorAttachment(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform (Built-in)</SelectItem>
                  <SelectItem value="cross-platform">Cross-platform (External)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>User Verification</Label>
              <Select value={userVerification} onValueChange={(value: 'required' | 'preferred' | 'discouraged') => setUserVerification(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="preferred">Preferred</SelectItem>
                  <SelectItem value="discouraged">Discouraged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attestation Level</Label>
            <Select value={attestation} onValueChange={(value: 'none' | 'indirect' | 'direct') => setAttestation(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="indirect">Indirect</SelectItem>
                <SelectItem value="direct">Direct (Highest Security)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleRegister}
            disabled={!friendlyName.trim() || isRegistering}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                Register Biometric Credential
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last Authentication Result */}
      {lastAuthentication && (
        <Card className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Last Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="success" className="ml-2">
                  {lastAuthentication.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">User Verified:</span>
                <Badge variant={lastAuthentication.userVerified ? 'success' : 'secondary'} className="ml-2">
                  {lastAuthentication.userVerified ? 'YES' : 'NO'}
                </Badge>
              </div>
              {lastAuthentication.credentialId && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Credential ID:</span>
                  <code className="ml-2 text-xs font-mono bg-black/20 px-2 py-1 rounded">
                    {lastAuthentication.credentialId.slice(0, 16)}...
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}