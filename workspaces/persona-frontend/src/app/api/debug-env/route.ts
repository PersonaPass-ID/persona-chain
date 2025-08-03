// Temporary debug route - DELETE AFTER TESTING
export async function GET() {
  return Response.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
    VERCEL_URL: process.env.VERCEL_URL || 'MISSING', 
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
    hasGitHubId: !!process.env.GITHUB_CLIENT_ID,
    hasGitHubSecret: !!process.env.GITHUB_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET
  })
}