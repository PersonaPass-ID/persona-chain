// Temporary debug route - DELETE AFTER TESTING
export async function GET(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get('host')
  
  return Response.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
    VERCEL_URL: process.env.VERCEL_URL || 'MISSING', 
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
    hasGitHubId: !!process.env.GITHUB_CLIENT_ID,
    hasGitHubSecret: !!process.env.GITHUB_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    actualHost: host,
    actualOrigin: url.origin,
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL || url.origin}/api/auth/callback/github`,
    allHeaders: Object.fromEntries(request.headers.entries())
  })
}