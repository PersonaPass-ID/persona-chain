// Supabase Service for AWS Lambda Functions
// Replaces DynamoDB operations with PostgreSQL via Supabase

import { createClient } from '@supabase/supabase-js'

// Environment validation
function validateSupabaseEnvironment() {
  const requiredEnvVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please configure Supabase credentials.`)
  }

  return requiredEnvVars as { [K in keyof typeof requiredEnvVars]: string }
}

// Create Supabase client with service role key for Lambda
let supabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabase) {
    const env = validateSupabaseEnvironment()
    
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public' as any
      },
      global: {
        headers: {
          'X-Client-Info': 'PersonaPass Lambda Service'
        }
      }
    })

    console.log('✅ Supabase Lambda client initialized')
  }

  return supabase as any
}

// Interface definitions for database records
export interface IdentityRecord {
  id?: string
  did: string
  wallet_address: string
  content_hash: string
  encrypted_content: string
  metadata: any
  encryption_params: any
  blockchain_tx_hash?: string
  blockchain_anchor?: any
  created_at?: string
  updated_at?: string
}

export interface CredentialRecord {
  id?: string
  credential_id: string
  credential_type: string
  did: string
  subject_did: string
  issuer_did: string
  content_hash: string
  encrypted_credential: string
  status: string
  issuance_date: string
  expiration_date?: string
  metadata: any
  encryption_params: any
  blockchain_anchor?: any
  created_at?: string
  updated_at?: string
}

export interface DIDDocumentData {
  walletAddress: string
  did: string
  firstName: string
  lastName: string
  authMethod: string
  identifier: string
  status: string
  verificationLevel: string
  metadata: any
}

export interface UserAccount {
  id?: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  username: string
  verified: boolean
  created_at?: string
  updated_at?: string
}

export interface AuthMethod {
  id: string
  did: string
  method_type: string
  method_id: string
  oauth_provider?: string
  oauth_user_id?: string
  oauth_email?: string
  oauth_name?: string
  encrypted_secret?: string
  encrypted_tokens?: string
  public_key_hash: string
  attestation?: string
  blockchain_tx_hash?: string
  blockchain_block_height?: number
  is_active: boolean
  is_primary: boolean
  last_used_at?: string
  created_at?: string
  updated_at?: string
}

export interface AuthAttempt {
  id?: string
  did: string
  method_type: string
  ip_address: string
  success: boolean
  failure_reason?: string | null
  attempted_at: string
  metadata?: string
}

export interface Session {
  session_id: string
  did: string
  method_id: string
  session_token_hash: string
  device_info: string
  expires_at: string
  revoked?: boolean
  created_at: string
}

export interface TrustedDevice {
  device_token: string
  did: string
  device_fingerprint: string
  device_info: string
  trusted_at: string
  expires_at: string
  revoked?: boolean
}

export interface RecoveryCode {
  id?: string
  did: string
  code_hash: string
  used: boolean
  used_at?: string
  created_at: string
}

/**
 * Supabase Service Class for Lambda Operations
 * Replaces DynamoDB with PostgreSQL queries
 */
export class SupabaseService {
  private client = getSupabaseClient()

  /**
   * Verification Code Operations (new functionality)
   */
  async storeVerificationCode(
    identifier: string, 
    code: string, 
    type: 'email' | 'phone', 
    expiresAt: Date
  ): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('verification_codes')
        .insert({
          identifier: identifier.toLowerCase(),
          code: code,
          type: type,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing verification code:', error);
        throw new Error(`Failed to store verification code: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('❌ Store verification code failed:', error);
      throw error;
    }
  }

  async getVerificationCode(identifier: string, type: 'email' | 'phone'): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('verification_codes')
        .select('*')
        .eq('identifier', identifier.toLowerCase())
        .eq('type', type)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error retrieving verification code:', error);
        throw new Error(`Failed to retrieve verification code: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('❌ Get verification code failed:', error);
      throw error;
    }
  }

  async deleteVerificationCode(identifier: string, type: 'email' | 'phone'): Promise<void> {
    try {
      const { error } = await this.client
        .from('verification_codes')
        .delete()
        .eq('identifier', identifier.toLowerCase())
        .eq('type', type);

      if (error) {
        console.error('Error deleting verification code:', error);
        throw new Error(`Failed to delete verification code: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Delete verification code failed:', error);
      throw error;
    }
  }

  /**
   * Store DID document (replaces DynamoDB PutCommand)
   */
  async storeDIDDocument(data: DIDDocumentData): Promise<IdentityRecord> {
    try {
      console.log(`📝 Storing DID document for ${data.did}`)

      const identityRecord: Omit<IdentityRecord, 'id' | 'created_at' | 'updated_at'> = {
        did: data.did,
        wallet_address: data.walletAddress,
        content_hash: `hash-${Date.now()}`,
        encrypted_content: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          authMethod: data.authMethod,
          identifier: data.identifier
        }),
        metadata: {
          ...data.metadata,
          type: 'did-document',
          issuer: 'personachain',
          schema_version: '1.0',
          storage: 'supabase'
        },
        encryption_params: {
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error } = await this.client
        .from('identity_records')
        .insert(identityRecord)
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to store DID document:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ DID document stored: ${data.did}`)
      return storedRecord as unknown as unknown as IdentityRecord

    } catch (error) {
      console.error('❌ Store DID document failed:', error)
      throw error
    }
  }

  /**
   * Get DID document by wallet address (replaces DynamoDB QueryCommand)
   */
  async getDIDByWalletAddress(walletAddress: string): Promise<IdentityRecord | null> {
    try {
      const { data, error } = await this.client
        .from('identity_records')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return data as unknown as IdentityRecord

    } catch (error) {
      console.error('❌ Get DID by wallet failed:', error)
      throw error
    }
  }

  /**
   * Get DID document by DID (replaces DynamoDB QueryCommand)
   */
  async getDIDDocument(did: string): Promise<IdentityRecord | null> {
    try {
      const { data, error } = await this.client
        .from('identity_records')
        .select('*')
        .eq('did', did)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return data as unknown as IdentityRecord

    } catch (error) {
      console.error('❌ Get DID document failed:', error)
      throw error
    }
  }

  /**
   * Store verifiable credential (replaces DynamoDB PutCommand)
   */
  async storeCredential(credential: any, walletAddress: string): Promise<CredentialRecord> {
    try {
      console.log(`📜 Storing credential ${credential.id}`)

      // Get the DID for this wallet
      const identityRecord = await this.getDIDByWalletAddress(walletAddress)
      if (!identityRecord) {
        throw new Error('DID not found for wallet address - must create identity first')
      }

      const credentialRecord: Omit<CredentialRecord, 'id' | 'created_at' | 'updated_at'> = {
        credential_id: credential.id,
        credential_type: Array.isArray(credential.type) ? credential.type.join(',') : credential.type,
        did: identityRecord.did,
        subject_did: credential.credentialSubject.id,
        issuer_did: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        content_hash: `hash-${Date.now()}`,
        encrypted_credential: JSON.stringify(credential),
        status: 'valid',
        issuance_date: credential.issuanceDate,
        expiration_date: credential.expirationDate,
        metadata: {
          type: 'verifiable-credential',
          issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          schema_version: '1.0',
          storage: 'supabase'
        },
        encryption_params: {
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error } = await this.client
        .from('verifiable_credentials')
        .insert(credentialRecord)
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to store credential:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Credential stored: ${credential.id}`)
      return storedRecord as unknown as CredentialRecord

    } catch (error) {
      console.error('❌ Store credential failed:', error)
      throw error
    }
  }

  /**
   * Get credentials for a wallet address (replaces DynamoDB QueryCommand)
   */
  async getCredentialsByWallet(walletAddress: string): Promise<CredentialRecord[]> {
    try {
      // First get the DID for this wallet
      const identityRecord = await this.getDIDByWalletAddress(walletAddress)
      if (!identityRecord) {
        return []
      }

      const { data, error } = await this.client
        .from('verifiable_credentials')
        .select('*')
        .eq('subject_did', identityRecord.did)
        .eq('status', 'valid')

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data || []) as unknown as CredentialRecord[]

    } catch (error) {
      console.error('❌ Get credentials by wallet failed:', error)
      throw error
    }
  }

  /**
   * Get credentials by DID (replaces DynamoDB QueryCommand)
   */
  async getCredentialsByDID(did: string): Promise<CredentialRecord[]> {
    try {
      const { data, error } = await this.client
        .from('verifiable_credentials')
        .select('*')
        .eq('subject_did', did)
        .eq('status', 'valid')

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data || []) as unknown as CredentialRecord[]

    } catch (error) {
      console.error('❌ Get credentials by DID failed:', error)
      throw error
    }
  }

  /**
   * Verify credential exists (replaces DynamoDB QueryCommand)
   */
  async verifyCredential(credentialId: string): Promise<CredentialRecord | null> {
    try {
      const { data, error } = await this.client
        .from('verifiable_credentials')
        .select('*')
        .eq('credential_id', credentialId)
        .eq('status', 'valid')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return data as unknown as CredentialRecord

    } catch (error) {
      console.error('❌ Verify credential failed:', error)
      throw error
    }
  }

  /**
   * Create user account
   */
  async createUserAccount(userData: UserAccount): Promise<UserAccount> {
    try {
      console.log(`👤 Creating user account for ${userData.email}`)

      const { data: storedUser, error } = await this.client
        .from('user_accounts')
        .insert({
          email: userData.email,
          password_hash: userData.password_hash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          verified: userData.verified
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to create user account:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ User account created: ${userData.email}`)
      return storedUser as unknown as UserAccount

    } catch (error) {
      console.error('❌ Create user account failed:', error)
      throw error
    }
  }

  /**
   * Get user account by email
   */
  async getUserByEmail(email: string): Promise<UserAccount | null> {
    try {
      const { data, error } = await this.client
        .from('user_accounts')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return data as unknown as UserAccount

    } catch (error) {
      console.error('❌ Get user by email failed:', error)
      throw error
    }
  }

  /**
   * Get user account by username
   */
  async getUserByUsername(username: string): Promise<UserAccount | null> {
    try {
      const { data, error } = await this.client
        .from('user_accounts')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return data as unknown as UserAccount

    } catch (error) {
      console.error('❌ Get user by username failed:', error)
      throw error
    }
  }

  /**
   * Authentication method operations
   */
  async storeAuthMethod(authMethod: Omit<AuthMethod, 'created_at' | 'updated_at'>): Promise<AuthMethod> {
    try {
      const { data, error } = await this.client
        .from('auth_methods')
        .insert(authMethod)
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to store auth method:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      return data as AuthMethod
    } catch (error) {
      console.error('❌ Store auth method failed:', error)
      throw error
    }
  }

  async getAuthMethodByDID(did: string, methodType: string): Promise<AuthMethod | null> {
    try {
      const { data, error } = await this.client
        .from('auth_methods')
        .select('*')
        .eq('did', did)
        .eq('method_type', methodType)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      return data as AuthMethod | null
    } catch (error) {
      console.error('❌ Get auth method by DID failed:', error)
      throw error
    }
  }

  async getAuthMethodById(id: string): Promise<AuthMethod | null> {
    try {
      const { data, error } = await this.client
        .from('auth_methods')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      return data as AuthMethod | null
    } catch (error) {
      console.error('❌ Get auth method by ID failed:', error)
      throw error
    }
  }

  async updateAuthMethod(id: string, updates: Partial<AuthMethod>): Promise<void> {
    try {
      const { error } = await this.client
        .from('auth_methods')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      console.error('❌ Update auth method failed:', error)
      throw error
    }
  }

  /**
   * Recovery code operations
   */
  async storeRecoveryCode(did: string, codeHash: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('recovery_codes')
        .insert({
          did,
          code_hash: codeHash,
          used: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      console.error('❌ Store recovery code failed:', error)
      throw error
    }
  }

  /**
   * Authentication attempt tracking
   */
  async recordAuthAttempt(attempt: Omit<AuthAttempt, 'id'>): Promise<void> {
    try {
      const { error } = await this.client
        .from('auth_attempts')
        .insert(attempt)

      if (error) {
        console.error('Failed to record auth attempt:', error)
        // Don't throw - this is logging, not critical
      }
    } catch (error) {
      console.error('❌ Record auth attempt failed:', error)
      // Don't throw - this is logging, not critical
    }
  }

  async getAuthAttempts(did: string, ipAddress: string, since: string): Promise<AuthAttempt[]> {
    try {
      const { data, error } = await this.client
        .from('auth_attempts')
        .select('*')
        .eq('did', did)
        .eq('ip_address', ipAddress)
        .gte('attempted_at', since)
        .order('attempted_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data || []) as AuthAttempt[]
    } catch (error) {
      console.error('❌ Get auth attempts failed:', error)
      throw error
    }
  }

  /**
   * Session management
   */
  async storeSession(session: Session): Promise<void> {
    try {
      const { error } = await this.client
        .from('sessions')
        .insert(session)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      console.error('❌ Store session failed:', error)
      throw error
    }
  }

  async revokeSession(sessionTokenHash: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('sessions')
        .update({ revoked: true })
        .eq('session_token_hash', sessionTokenHash)
        .eq('revoked', false)
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('❌ Revoke session failed:', error)
      throw error
    }
  }

  async revokeAllSessions(did: string): Promise<number> {
    try {
      const { data, error } = await this.client
        .from('sessions')
        .update({ revoked: true })
        .eq('did', did)
        .eq('revoked', false)
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data?.length || 0
    } catch (error) {
      console.error('❌ Revoke all sessions failed:', error)
      throw error
    }
  }

  /**
   * Trusted device management
   */
  async getTrustedDevice(did: string, fingerprint: string): Promise<TrustedDevice | null> {
    try {
      const { data, error } = await this.client
        .from('trusted_devices')
        .select('*')
        .eq('did', did)
        .eq('device_fingerprint', fingerprint)
        .eq('revoked', false)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      return data as TrustedDevice | null
    } catch (error) {
      console.error('❌ Get trusted device failed:', error)
      throw error
    }
  }

  async storeTrustedDevice(device: TrustedDevice): Promise<void> {
    try {
      const { error } = await this.client
        .from('trusted_devices')
        .insert(device)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      console.error('❌ Store trusted device failed:', error)
      throw error
    }
  }

  async revokeTrustedDevice(deviceToken: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('trusted_devices')
        .update({ revoked: true })
        .eq('device_token', deviceToken)
        .eq('revoked', false)
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('❌ Revoke trusted device failed:', error)
      throw error
    }
  }

  async getTrustedDeviceByToken(deviceToken: string): Promise<TrustedDevice | null> {
    try {
      const { data, error } = await this.client
        .from('trusted_devices')
        .select('*')
        .eq('device_token', deviceToken)
        .eq('revoked', false)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      return data as TrustedDevice | null
    } catch (error) {
      console.error('❌ Get trusted device by token failed:', error)
      throw error
    }
  }

  /**
   * User permissions (placeholder for future role-based access)
   */
  async getUserPermissions(did: string): Promise<string[]> {
    try {
      // For now, return empty array - can be extended with role-based permissions
      return []
    } catch (error) {
      console.error('❌ Get user permissions failed:', error)
      return []
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.client
        .from('identity_records')
        .select('count')
        .limit(1)

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`
        }
      }

      return {
        success: true,
        message: 'Supabase connection healthy'
      }

    } catch (error) {
      return {
        success: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
export default supabaseService