// GitHub OAuth Service - Production authentication with NextAuth.js
// Handles OAuth flow and creates VCs from authenticated GitHub sessions

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Octokit } from '@octokit/rest'
import type { VerifiableCredential, GitHubProfile } from './github-verification'

export interface GitHubOAuthResult {
  success: boolean
  profile?: GitHubProfile
  credential?: VerifiableCredential
  error?: string
  verificationLevel?: 'basic' | 'experienced' | 'expert'
}

export class GitHubOAuthService {
  private readonly ISSUER_DID = 'did:personapass:issuer'

  /**
   * Create VC from authenticated NextAuth session
   */
  async createCredentialFromSession(userId: string, walletAddress: string): Promise<GitHubOAuthResult> {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.accessToken || !session?.user?.githubUsername) {
        return {
          success: false,
          error: 'Not authenticated with GitHub or missing required data'
        }
      }

      // Use the OAuth access token to fetch detailed profile
      const octokit = new Octokit({
        auth: session.accessToken,
        userAgent: 'PersonaPass-OAuth/1.0.0'
      })

      const { data: user } = await octokit.rest.users.getByUsername({
        username: session.user.githubUsername
      })

      // Calculate account age
      const accountCreated = new Date(user.created_at)
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

      const profile: GitHubProfile = {
        username: user.login,
        id: user.id,
        accountCreated: user.created_at,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        avatarUrl: user.avatar_url,
        name: user.name,
        company: user.company,
        location: user.location,
        email: user.email,
        bio: user.bio,
        verified: true
      }

      // Analyze developer level
      const verificationLevel = this.analyzeDeveloperLevel(profile)

      // Create verifiable credential
      const credential = this.createDeveloperCredential(userId, profile, verificationLevel)

      console.log(`✅ GitHub OAuth verification complete: ${verificationLevel} level developer`)

      return {
        success: true,
        profile,
        credential,
        verificationLevel
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
   * Check if user has valid GitHub session
   */
  async hasValidGitHubSession(): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      return !!(session?.accessToken && session?.user?.githubUsername)
    } catch (error) {
      console.error('Error checking GitHub session:', error)
      return false
    }
  }

  /**
   * Get current GitHub session info
   */
  async getGitHubSessionInfo() {
    try {
      const session = await getServerSession(authOptions)
      
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
    } catch (error) {
      console.error('Error getting GitHub session info:', error)
      return null
    }
  }
}

// Export singleton instance
export const githubOAuthService = new GitHubOAuthService()

// Convenience functions
export const createCredentialFromGitHubSession = (userId: string, walletAddress: string) =>
  githubOAuthService.createCredentialFromSession(userId, walletAddress)

export const hasValidGitHubSession = () =>
  githubOAuthService.hasValidGitHubSession()

export const getGitHubSessionInfo = () =>
  githubOAuthService.getGitHubSessionInfo()