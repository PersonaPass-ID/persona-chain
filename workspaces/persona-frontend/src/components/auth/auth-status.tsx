'use client'

/**
 * Auth Status Component - Displays current authentication status
 * Shows user info, session details, and auth method information
 */

import React, { useState, useCallback } from 'react'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Shield, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  LogOut,
  Smartphone,
  Key,
  Globe,
  Settings,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface AuthStatusProps {
  showDetails?: boolean
  compact?: boolean
  onLogout?: () => void
}

export function AuthStatus({ showDetails = true, compact = false, onLogout }: AuthStatusProps) {
  const {
    isAuthenticated,
    isLoading,
    user,
    session,
    authMethods,
    primaryMethod,
    deviceTrusted,
    deviceInfo,
    error,
    logout,
    refreshSession,
    lastActivity
  } = usePersonaAuth()

  const {
    isAuthenticated: walletConnected,
    user: walletUser,
    disconnect: disconnectWallet
  } = useWalletAuth()

  const [isCollapsed, setIsCollapsed] = useState(!showDetails)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleLogout = useCallback(async () => {
    await logout()
    onLogout?.()
  }, [logout, onLogout])

  const handleRefreshSession = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshSession])

  const getAuthMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'totp':
        return <Smartphone className="h-4 w-4" />
      case 'oauth_microsoft':
      case 'oauth_google':
      case 'oauth_github':
        return <Globe className="h-4 w-4" />
      default:
        return <Key className="h-4 w-4" />
    }
  }

  const getAuthMethodLabel = (methodType: string) => {
    switch (methodType) {
      case 'totp':
        return 'TOTP'
      case 'oauth_microsoft':
        return 'Microsoft'
      case 'oauth_google':
        return 'Google'
      case 'oauth_github':
        return 'GitHub'
      default:
        return methodType.toUpperCase()
    }
  }

  const getStatusColor = () => {
    if (error) return 'text-red-600'
    if (isAuthenticated && walletConnected) return 'text-green-600'
    if (isAuthenticated || walletConnected) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getStatusText = () => {
    if (error) return 'Error'
    if (isAuthenticated && walletConnected) return 'Fully Authenticated'
    if (isAuthenticated) return 'Authenticated (No Wallet)'
    if (walletConnected) return 'Wallet Connected'
    return 'Not Authenticated'
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {walletConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Wallet className="h-4 w-4 text-gray-400" />
          )}
          {isAuthenticated ? (
            <Shield className="h-4 w-4 text-green-600" />
          ) : (
            <Shield className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {(isAuthenticated || walletConnected) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-8 px-2"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Authentication Status
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription className={getStatusColor()}>
              {getStatusText()}
            </CardDescription>
          </div>
          
          {showDetails && (
            <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Details
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isCollapsed ? '' : 'transform rotate-180'}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Wallet className={`h-4 w-4 ${walletConnected ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="text-sm">
              Wallet: {walletConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className={`h-4 w-4 ${isAuthenticated ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="text-sm">
              Auth: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
        </div>

        {showDetails && (
          <Collapsible open={!isCollapsed}>
            <CollapsibleContent className="space-y-4">
              <Separator />

              {/* Wallet Information */}
              {walletUser && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Wallet Information</h4>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">DID</div>
                      <code className="text-xs break-all">{walletUser.did}</code>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Address</div>
                      <code className="text-xs break-all">{walletUser.address}</code>
                    </div>
                    {walletUser.walletType && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Wallet Type</div>
                        <Badge variant="secondary">{walletUser.walletType}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Session Information */}
              {session && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Session Information</h4>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Method</div>
                      <div className="flex items-center space-x-1">
                        {getAuthMethodIcon(session.method_type)}
                        <Badge variant="secondary">{getAuthMethodLabel(session.method_type)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Expires</div>
                      <div className="text-xs">
                        {format(new Date(session.expires_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                    {lastActivity && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Last Activity</div>
                        <div className="text-xs">
                          {formatDistanceToNow(lastActivity, { addSuffix: true })}
                        </div>
                      </div>
                    )}
                    {deviceTrusted && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Trusted Device</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authentication Methods */}
              {authMethods.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Authentication Methods</h4>
                  <div className="space-y-2">
                    {authMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          {getAuthMethodIcon(method.method_type)}
                          <span className="text-sm">{getAuthMethodLabel(method.method_type)}</span>
                          {method.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          {method.last_used_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(method.last_used_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device Information */}
              {deviceInfo && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Device Information</h4>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Trust Status</div>
                      <Badge variant={deviceTrusted ? "default" : "secondary"}>
                        {deviceTrusted ? 'Trusted' : 'Not Trusted'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Fingerprint</div>
                      <code className="text-xs break-all">{deviceInfo.fingerprint}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                {isAuthenticated && (
                  <Button
                    onClick={handleRefreshSession}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-1" />
                    )}
                    Refresh Session
                  </Button>
                )}
                
                {(isAuthenticated || walletConnected) && (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}