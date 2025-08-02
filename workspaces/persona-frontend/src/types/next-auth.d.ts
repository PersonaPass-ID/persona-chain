// NextAuth.js Type Extensions
// Adds custom properties to session and JWT tokens

import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      githubId?: number
      githubUsername?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    githubId?: number
    githubUsername?: string
  }
}