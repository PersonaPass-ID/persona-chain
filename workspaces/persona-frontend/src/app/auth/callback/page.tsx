'use client'

/**
 * OAuth Callback Page - Handles OAuth provider callbacks
 * This page processes OAuth authorization codes and completes authentication
 */

import { OAuthCallback } from '@/components/auth/oauth-callback'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading OAuth Callback...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your authentication
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OAuthCallback redirectTo="/dashboard" />
    </Suspense>
  )
}