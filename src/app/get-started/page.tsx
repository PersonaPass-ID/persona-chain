'use client'

import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { OnboardingResult } from '@/lib/blockchain'

export default function GetStartedPage() {
  const router = useRouter()

  const handleOnboardingComplete = (result: OnboardingResult) => {
    // Store profile data for dashboard
    const profileData = {
      did: result.did,
      createdAt: new Date().toISOString(),
      completedOnboarding: true
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('persona_profile', JSON.stringify(profileData))
      if (result.did) {
        localStorage.setItem('persona_did', result.did)
      }
    }
    
    // Navigate to dashboard
    router.push('/dashboard')
  }

  const handleOnboardingError = (error: string, step: string) => {
    console.error(`Onboarding error in step ${step}:`, error)
    // You could add error tracking here
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* State-of-the-art onboarding system */}
      <div className="pt-16">
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onError={handleOnboardingError}
          enableAnalytics={true}
          theme="auto"
        />
      </div>
    </div>
  )
}