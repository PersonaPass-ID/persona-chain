// Configuration Check API Endpoint
// Validates environment setup for real infrastructure

import { NextApiRequest, NextApiResponse } from 'next'

interface ConfigCheckResponse {
  success: boolean
  status: 'ready' | 'partial' | 'not-configured'
  configuration: {
    supabase: {
      configured: boolean
      url: string | null
      anonKey: boolean
      serviceKey: boolean
      message: string
    }
    personachain: {
      configured: boolean
      rpcUrl: string | null
      restUrl: string | null
      message: string
    }
    dependencies: {
      configured: boolean
      supabaseClient: boolean
      message: string
    }
  }
  nextSteps: string[]
  message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ConfigCheckResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'not-configured',
      configuration: {
        supabase: { configured: false, url: null, anonKey: false, serviceKey: false, message: 'Method not allowed' },
        personachain: { configured: false, rpcUrl: null, restUrl: null, message: 'Method not allowed' },
        dependencies: { configured: false, supabaseClient: false, message: 'Method not allowed' }
      },
      nextSteps: [],
      message: 'Method not allowed'
    })
  }

  console.log('🔧 Config Check: Validating environment configuration...')

  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
  const supabaseComplete = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceKey)

  let supabaseMessage = 'Not configured'
  if (supabaseComplete) {
    supabaseMessage = 'Fully configured ✅'
  } else if (supabaseConfigured) {
    supabaseMessage = 'Basic configuration present, missing service key'
  } else if (supabaseUrl && !supabaseAnonKey) {
    supabaseMessage = 'URL configured, missing anon key'
  } else if (!supabaseUrl && supabaseAnonKey) {
    supabaseMessage = 'Anon key configured, missing URL'
  } else {
    supabaseMessage = 'URL and keys missing - please configure'
  }

  // Check PersonaChain configuration
  const personachainRpc = process.env.NEXT_PUBLIC_PERSONACHAIN_RPC
  const personachainRest = process.env.NEXT_PUBLIC_PERSONACHAIN_REST

  const personachainConfigured = Boolean(personachainRpc && personachainRest)

  let personachainMessage = 'Not configured'
  if (personachainConfigured) {
    personachainMessage = 'Fully configured ✅'
  } else if (personachainRpc && !personachainRest) {
    personachainMessage = 'RPC configured, missing REST endpoint'
  } else if (!personachainRpc && personachainRest) {
    personachainMessage = 'REST configured, missing RPC endpoint'
  } else {
    personachainMessage = 'RPC and REST endpoints missing'
  }

  // Check dependencies
  let supabaseClientAvailable = false
  let dependencyMessage = 'Not checked'
  
  try {
    require('@supabase/supabase-js')
    supabaseClientAvailable = true
    dependencyMessage = 'Supabase client available ✅'
  } catch (error) {
    dependencyMessage = 'Supabase client not installed - run: npm install @supabase/supabase-js'
  }

  // Determine overall status
  let overallStatus: 'ready' | 'partial' | 'not-configured' = 'not-configured'
  
  if (supabaseComplete && personachainConfigured && supabaseClientAvailable) {
    overallStatus = 'ready'
  } else if (supabaseConfigured || personachainConfigured) {
    overallStatus = 'partial'
  }

  // Generate next steps
  const nextSteps: string[] = []

  if (!supabaseClientAvailable) {
    nextSteps.push('Install Supabase client: npm install @supabase/supabase-js')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    nextSteps.push('Configure Supabase credentials in .env.local (see SUPABASE-SETUP-GUIDE.md)')
  }

  if (!supabaseServiceKey) {
    nextSteps.push('Add SUPABASE_SERVICE_ROLE_KEY to .env.local for admin operations')
  }

  if (!personachainRpc || !personachainRest) {
    nextSteps.push('Verify PersonaChain RPC and REST endpoints in .env.local')
  }

  if (overallStatus === 'ready') {
    nextSteps.push('Configuration complete! Test with: POST /api/test/real-identity-flow')
    nextSteps.push('Check health status: GET /api/identity/health')
  }

  let overallMessage = 'Configuration incomplete'
  if (overallStatus === 'ready') {
    overallMessage = '🎉 Configuration complete! Ready for real Web3 identity operations.'
  } else if (overallStatus === 'partial') {
    overallMessage = '⚠️ Partial configuration detected. Some features may not work.'
  } else {
    overallMessage = '❌ Configuration required. Please set up Supabase and check dependencies.'
  }

  console.log(`🔧 Config Status: ${overallStatus.toUpperCase()}`)

  const response: ConfigCheckResponse = {
    success: overallStatus !== 'not-configured',
    status: overallStatus,
    configuration: {
      supabase: {
        configured: supabaseConfigured,
        url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
        anonKey: Boolean(supabaseAnonKey),
        serviceKey: Boolean(supabaseServiceKey),
        message: supabaseMessage
      },
      personachain: {
        configured: personachainConfigured,
        rpcUrl: personachainRpc || null,
        restUrl: personachainRest || null,
        message: personachainMessage
      },
      dependencies: {
        configured: supabaseClientAvailable,
        supabaseClient: supabaseClientAvailable,
        message: dependencyMessage
      }
    },
    nextSteps,
    message: overallMessage
  }

  const httpStatus = overallStatus === 'ready' ? 200 : overallStatus === 'partial' ? 206 : 422

  return res.status(httpStatus).json(response)
}