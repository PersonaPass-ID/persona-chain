// GitHub OAuth Service - Production authentication with NextAuth.js
// Handles OAuth flow and creates VCs from authenticated GitHub sessions

// import { Octokit } from '@octokit/rest' // Reserved for future direct GitHub API usage
import type { VerifiableCredential, GitHubProfile } from './github-verification'
import { personaChainService } from './personachain-service'
import type { PersonaChainResult } from './personachain-service'
import { credentialManagementService } from './credential-management-service'

export interface GitHubOAuthResult {
  success: boolean
  profile?: GitHubProfile
  credential?: VerifiableCredential
  error?: string
  verificationLevel?: 'basic' | 'experienced' | 'expert'
  blockchainResult?: PersonaChainResult
  txHash?: string
  blockHeight?: number
}

export class GitHubOAuthService {
  private readonly ISSUER_DID = 'did:personapass:issuer'

  /**
   * Create VC from authenticated NextAuth session (client-side)
   */
  async createCredentialFromSession(userId: string, walletAddress: string, session: { user?: { githubUsername?: string }; accessToken?: string }): Promise<GitHubOAuthResult> {
    try {
      if (!session?.user?.githubUsername) {
        return {
          success: false,
          error: 'Not authenticated with GitHub or missing required data'
        }
      }

      // Fetch real GitHub profile data using the access token
      const accessToken = session.accessToken
      if (!accessToken) {
        return {
          success: false,
          error: 'No GitHub access token available'
        }
      }

      const profile = await this.fetchRealGitHubProfile(session.user.githubUsername, accessToken)

      // Calculate account age from profile
      const accountCreated = new Date(profile.accountCreated)
      const now = new Date()
      const accountAgeMonths = Math.floor(
        (now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      // Check minimum requirements
      if (accountAgeMonths < 6) {
        return {
          success: false,
          error: 'GitHub account must be at least 6 months old'
        }
      }

      // Analyze developer level
      const verificationLevel = this.analyzeDeveloperLevel(profile)

      // Create verifiable credential
      const credential = this.createDeveloperCredential(userId, profile, verificationLevel)

      console.log(`✅ GitHub OAuth verification complete: ${verificationLevel} level developer`)
      console.log(`⛓️ Storing credential on PersonaChain...`)

      // Store credential on PersonaChain blockchain
      const blockchainResult = await personaChainService.storeCredential(walletAddress, credential)

      if (blockchainResult.success) {
        console.log(`🎉 Credential stored on PersonaChain! TxHash: ${blockchainResult.txHash}`)
        console.log(`📊 Block Height: ${blockchainResult.blockHeight}`)
        
        // Track credential creation event
        if (blockchainResult.data) {
          credentialManagementService.trackCredentialEvent(
            walletAddress,
            blockchainResult.data.id,
            'created',
            {
              txHash: blockchainResult.txHash,
              blockHeight: blockchainResult.blockHeight
            }
          )
        }
      } else {
        console.error(`❌ Failed to store on PersonaChain: ${blockchainResult.error}`)
      }

      return {
        success: true,
        profile,
        credential,
        verificationLevel,
        blockchainResult,
        txHash: blockchainResult.txHash,
        blockHeight: blockchainResult.blockHeight
      }

    } catch (error) {
      console.error('❌ GitHub OAuth verification failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during GitHub OAuth verification'
      }
    }
  }

  /**
   * Analyze developer level based on GitHub activity
   */
  private analyzeDeveloperLevel(profile: GitHubProfile): 'basic' | 'experienced' | 'expert' {
    const { publicRepos, followers } = profile
    const accountAgeMonths = Math.floor(
      (new Date().getTime() - new Date(profile.accountCreated).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    // Expert developer criteria
    if (publicRepos >= 20 && followers >= 10 && accountAgeMonths >= 24) {
      return 'expert'
    }

    // Experienced developer criteria  
    if (publicRepos >= 10 && accountAgeMonths >= 12) {
      return 'experienced'
    }

    // Basic developer (minimum requirements met)
    return 'basic'
  }

  /**
   * Create verifiable credential for GitHub developer
   */
  private createDeveloperCredential(
    userId: string,
    profile: GitHubProfile,
    level: 'basic' | 'experienced' | 'expert'
  ): VerifiableCredential {
    const accountAgeMonths = Math.floor(
      (new Date().getTime() - new Date(profile.accountCreated).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.com/credentials/github/v1'
      ],
      type: ['VerifiableCredential', 'GitHubDeveloperCredential'],
      issuer: this.ISSUER_DID,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: `did:personapass:${userId}`,
        githubUsername: profile.username,
        githubId: profile.id,
        accountAgeMonths,
        publicRepos: profile.publicRepos,
        followers: profile.followers,
        verified: true,
        verificationLevel: level
      }
    }

    // Add cryptographic proof (placeholder for now)
    credential.proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${this.ISSUER_DID}#key-1`,
      proofPurpose: 'assertionMethod',
      jws: 'oauth_proof_' + Date.now() // In production, this would be a real signature
    }

    return credential
  }

  /**
   * Fetch real GitHub profile data using access token
   */
  private async fetchRealGitHubProfile(username: string, accessToken: string): Promise<GitHubProfile> {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PersonaPass/1.0.0'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const userData = await response.json()

      const profile: GitHubProfile = {
        username: userData.login,
        id: userData.id,
        accountCreated: userData.created_at,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        avatarUrl: userData.avatar_url,
        name: userData.name,
        company: userData.company,
        location: userData.location,
        email: userData.email,
        bio: userData.bio,
        verified: true
      }

      console.log(`📊 Real GitHub profile fetched for ${username}:`, {
        repos: profile.publicRepos,
        followers: profile.followers,
        accountAge: Math.floor((new Date().getTime() - new Date(profile.accountCreated).getTime()) / (1000 * 60 * 60 * 24 * 30))
      })

      return profile

    } catch (error) {
      console.error('❌ Failed to fetch real GitHub profile:', error)
      throw new Error(`Failed to fetch GitHub profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if user has valid GitHub session (client-side)
   */
  hasValidGitHubSession(session: { user?: { githubUsername?: string } }): boolean {
    return !!(session?.user?.githubUsername)
  }

  /**
   * Get current GitHub session info (client-side)
   */
  getGitHubSessionInfo(session: { user?: { githubUsername?: string; githubId?: number; email?: string; name?: string; image?: string } }) {
    if (!session?.user?.githubUsername) {
      return null
    }

    return {
      username: session.user.githubUsername,
      githubId: session.user.githubId,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image
    }
  }
}

// Export singleton instance
export const githubOAuthService = new GitHubOAuthService()

// Convenience functions (updated for client-side usage)
export const createCredentialFromGitHubSession = (userId: string, walletAddress: string, session: { user?: { githubUsername?: string }; accessToken?: string }) =>
  githubOAuthService.createCredentialFromSession(userId, walletAddress, session)

export const hasValidGitHubSession = (session: { user?: { githubUsername?: string } }) =>
  githubOAuthService.hasValidGitHubSession(session)

export const getGitHubSessionInfo = (session: { user?: { githubUsername?: string; githubId?: number; email?: string; name?: string; image?: string } }) =>
  githubOAuthService.getGitHubSessionInfo(session)