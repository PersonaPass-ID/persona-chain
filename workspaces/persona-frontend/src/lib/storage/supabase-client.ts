// Real Supabase Client Configuration
// Connects to actual Supabase database for production Web3 identity storage

import { createClient } from '@supabase/supabase-js'

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value || value.includes('your_') || value === '')
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please configure Supabase credentials.`)
  }

  return requiredEnvVars as { [K in keyof typeof requiredEnvVars]: string }
}

// Create Supabase client
let supabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabase) {
    try {
      const env = validateEnvironment()
      
      supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false, // We handle auth with Web3 wallets
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'PersonaPass Web3 Identity Platform'
          }
        }
      })

      console.log('✅ Supabase client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error)
      throw error
    }
  }

  return supabase
}

// Health check function
export async function checkSupabaseConnection(): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    const client = getSupabaseClient()
    
    // Test connection with a simple query
    const { data, error } = await client
      .from('identity_records')
      .select('count')
      .limit(1)

    if (error) {
      return {
        success: false,
        message: 'Supabase connection failed',
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Supabase connection successful'
    }

  } catch (error) {
    return {
      success: false,
      message: 'Supabase client initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export for direct use
export { supabase }
export default getSupabaseClient