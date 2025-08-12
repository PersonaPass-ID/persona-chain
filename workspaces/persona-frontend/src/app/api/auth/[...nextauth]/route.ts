// NextAuth.js API Route - GitHub OAuth Configuration
// Handles GitHub OAuth authentication for production user login

import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email public_repo'
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  // Force use of custom domain for callbacks
  basePath: '/api/auth',
  useSecureCookies: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist GitHub access token and profile info
      if (account && profile) {
        token.accessToken = account.access_token
        token.githubId = profile.id
        token.githubUsername = (profile as { login: string }).login
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.user.githubId = token.githubId as number
      session.user.githubUsername = token.githubUsername as string
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }