/**
 * PersonaPass Health Check Endpoints
 * 
 * Comprehensive health monitoring for production deployment
 * monitoring including database, external services, and system metrics.
 * 
 * Endpoints:
 * - GET /api/health - Basic health check (load balancer)
 * - GET /api/health/detailed - Comprehensive system health
 * - GET /api/health/ready - Readiness probe (K8s/Docker)
 * - GET /api/health/live - Liveness probe (K8s/Docker)
 */

import { NextRequest, NextResponse } from 'next/server'
import { env, envValidationStatus } from '@/lib/env'

// Health check result interfaces
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
}

interface DetailedHealthStatus extends HealthStatus {
  checks: {
    environment: HealthCheck
    database: HealthCheck
    personachain: HealthCheck
    stripe: HealthCheck
    redis?: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
  }
  performance: {
    responseTime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: NodeJS.CpuUsage
  }
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  message: string
  responseTime?: number
  lastChecked: string
  details?: Record<string, any>
}

// Cache for health check results to avoid overwhelming external services
const healthCache = new Map<string, { result: HealthCheck; expiry: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Helper to get cached health check or run fresh check
async function getCachedHealthCheck(
  key: string, 
  checkFn: () => Promise<HealthCheck>
): Promise<HealthCheck> {
  const cached = healthCache.get(key)
  const now = Date.now()
  
  if (cached && cached.expiry > now) {
    return cached.result
  }
  
  try {
    const result = await checkFn()
    healthCache.set(key, { result, expiry: now + CACHE_TTL })
    return result
  } catch (error) {
    const errorResult: HealthCheck = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString()
    }
    healthCache.set(key, { result: errorResult, expiry: now + CACHE_TTL })
    return errorResult
  }
}

// Individual health check functions
async function checkEnvironment(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Environment validation was already run during app startup
    return {
      status: envValidationStatus.valid ? 'pass' : 'fail',
      message: envValidationStatus.valid 
        ? 'Environment variables validated successfully'
        : 'Environment validation failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        environment: envValidationStatus.environment,
        checkedAt: envValidationStatus.checkedAt,
        version: envValidationStatus.version
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Environment check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Simple connectivity check - in a real app you'd use your DB client
    // For now, we'll check if the DATABASE_URL is accessible format
    const url = new URL(env.DATABASE_URL)
    
    return {
      status: 'pass',
      message: 'Database configuration validated',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1), // Remove leading slash
        ssl: url.searchParams.get('sslmode') || 'prefer'
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkPersonaChain(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Test multiple RPC endpoints for comprehensive validation
    const rpcTests = [
      // 1. Basic status check
      {
        method: 'status',
        description: 'Node status and sync info'
      },
      // 2. Chain genesis validation
      {
        method: 'genesis',
        description: 'Genesis block validation'
      },
      // 3. Network info check
      {
        method: 'net_info',
        description: 'Network connectivity'
      }
    ]

    const testResults = []
    let latestBlock = 'unknown'
    let chainId = 'unknown'
    let nodeVersion = 'unknown'
    let peerCount = 0

    for (const test of rpcTests) {
      try {
        const response = await fetch(env.PERSONACHAIN_RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: test.method,
            id: Date.now()
          }),
          signal: AbortSignal.timeout(3000) // 3 second timeout per test
        })
        
        if (!response.ok) {
          testResults.push({
            test: test.method,
            status: 'fail',
            error: `HTTP ${response.status}`
          })
          continue
        }
        
        const data = await response.json()
        
        if (data.error) {
          testResults.push({
            test: test.method,
            status: 'fail',
            error: data.error.message || 'RPC error'
          })
          continue
        }

        // Extract useful information from each test
        if (test.method === 'status' && data.result) {
          latestBlock = data.result.sync_info?.latest_block_height || 'unknown'
          chainId = data.result.node_info?.network || 'unknown'
          nodeVersion = data.result.node_info?.version || 'unknown'
        }
        
        if (test.method === 'net_info' && data.result) {
          peerCount = data.result.n_peers || 0
        }

        testResults.push({
          test: test.method,
          status: 'pass',
          responseTime: Date.now() - startTime
        })
        
      } catch (error) {
        testResults.push({
          test: test.method,
          status: 'fail',
          error: error instanceof Error ? error.message : 'Test failed'
        })
      }
    }

    // Determine overall status
    const passedTests = testResults.filter(r => r.status === 'pass').length
    const totalTests = testResults.length
    
    let overallStatus: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'PersonaChain RPC is fully operational'
    
    if (passedTests === 0) {
      overallStatus = 'fail'
      message = 'PersonaChain RPC is not accessible'
    } else if (passedTests < totalTests) {
      overallStatus = 'warn'
      message = `PersonaChain RPC partially accessible (${passedTests}/${totalTests} tests passed)`
    }

    // Additional validation checks
    const validationIssues = []
    
    if (latestBlock === 'unknown') {
      validationIssues.push('Cannot retrieve latest block height')
    } else {
      const blockHeight = parseInt(latestBlock)
      if (blockHeight < 1000) {
        validationIssues.push('Block height suspiciously low')
      }
    }
    
    if (chainId !== env.PERSONACHAIN_CHAIN_ID && chainId !== 'unknown') {
      validationIssues.push(`Chain ID mismatch: expected ${env.PERSONACHAIN_CHAIN_ID}, got ${chainId}`)
    }
    
    if (peerCount < 3) {
      validationIssues.push(`Low peer count: ${peerCount} (recommend ≥3)`)
    }

    if (validationIssues.length > 0 && overallStatus === 'pass') {
      overallStatus = 'warn'
      message = `PersonaChain accessible but has issues: ${validationIssues.join(', ')}`
    }

    return {
      status: overallStatus,
      message,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        configuredChainId: env.PERSONACHAIN_CHAIN_ID,
        actualChainId: chainId,
        rpcUrl: env.PERSONACHAIN_RPC_URL,
        latestBlock,
        nodeVersion,
        peerCount,
        testResults,
        validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
        healthScore: Math.round((passedTests / totalTests) * 100)
      }
    }
    
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'PersonaChain check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        configuredChainId: env.PERSONACHAIN_CHAIN_ID,
        rpcUrl: env.PERSONACHAIN_RPC_URL,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Check Stripe API connectivity with a simple balance check
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Stripe-Version': '2023-10-16'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      status: 'pass',
      message: 'Stripe API is accessible',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        environment: env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
        currency: data.available?.[0]?.currency || 'usd'
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Stripe check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  if (!env.REDIS_URL) {
    return {
      status: 'warn',
      message: 'Redis not configured (using memory store)',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
  
  try {
    // In a real implementation, you'd use your Redis client
    // For now, we'll just validate the URL format
    const url = new URL(env.REDIS_URL)
    
    return {
      status: 'pass',
      message: 'Redis configuration validated',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        host: url.hostname,
        port: url.port || '6379'
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Redis check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkMemory(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const memUsage = process.memoryUsage()
    const totalMemory = memUsage.heapTotal
    const usedMemory = memUsage.heapUsed
    const memoryUtilization = (usedMemory / totalMemory) * 100
    
    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Memory usage is normal'
    
    if (memoryUtilization > 90) {
      status = 'fail'
      message = 'Critical: Memory usage above 90%'
    } else if (memoryUtilization > 75) {
      status = 'warn'
      message = 'Warning: Memory usage above 75%'
    }
    
    return {
      status,
      message,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        utilizationPercent: Math.round(memoryUtilization)
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Memory check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkDisk(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Basic disk space check using Node.js fs stats
    const fs = await import('fs/promises')
    const stats = await fs.stat('/tmp') // Check temp directory accessibility
    
    return {
      status: 'pass',
      message: 'Disk access is functional',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        tmpAccessible: true,
        checkType: 'basic_access'
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Disk check failed',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  }
}

// Determine overall system health status
function getOverallStatus(checks: Record<string, HealthCheck>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status)
  
  if (statuses.includes('fail')) {
    return 'unhealthy'
  }
  
  if (statuses.includes('warn')) {
    return 'degraded'
  }
  
  return 'healthy'
}

// Basic health check - GET /api/health
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const pathname = new URL(request.url).pathname
  
  try {
    // Basic health check (for load balancers)
    if (pathname === '/api/health') {
      const basicHealth: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        environment: env.NODE_ENV
      }
      
      return NextResponse.json(basicHealth, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'basic'
        }
      })
    }
    
    // Detailed health check - GET /api/health/detailed
    if (pathname === '/api/health/detailed') {
      const [
        environmentCheck,
        databaseCheck,
        personachainCheck,
        stripeCheck,
        redisCheck,
        memoryCheck,
        diskCheck
      ] = await Promise.all([
        getCachedHealthCheck('environment', checkEnvironment),
        getCachedHealthCheck('database', checkDatabase),
        getCachedHealthCheck('personachain', checkPersonaChain),
        getCachedHealthCheck('stripe', checkStripe),
        getCachedHealthCheck('redis', checkRedis),
        getCachedHealthCheck('memory', checkMemory),
        getCachedHealthCheck('disk', checkDisk)
      ])
      
      const checks = {
        environment: environmentCheck,
        database: databaseCheck,
        personachain: personachainCheck,
        stripe: stripeCheck,
        ...(env.REDIS_URL && { redis: redisCheck }),
        memory: memoryCheck,
        disk: diskCheck
      }
      
      const overallStatus = getOverallStatus(checks)
      const responseTime = Date.now() - startTime
      
      const detailedHealth: DetailedHealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        environment: env.NODE_ENV,
        checks,
        performance: {
          responseTime,
          memoryUsage: process.memoryUsage(),
          ...(process.cpuUsage && { cpuUsage: process.cpuUsage() })
        }
      }
      
      const statusCode = overallStatus === 'healthy' ? 200 : 
                        overallStatus === 'degraded' ? 200 : 503
      
      return NextResponse.json(detailedHealth, {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'detailed'
        }
      })
    }
    
    // Readiness probe - GET /api/health/ready
    if (pathname === '/api/health/ready') {
      // Check if app is ready to serve traffic
      const [environmentCheck, databaseCheck] = await Promise.all([
        getCachedHealthCheck('environment', checkEnvironment),
        getCachedHealthCheck('database', checkDatabase)
      ])
      
      const isReady = environmentCheck.status === 'pass' && 
                     databaseCheck.status === 'pass'
      
      const readinessStatus = {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          environment: environmentCheck,
          database: databaseCheck
        }
      }
      
      return NextResponse.json(readinessStatus, {
        status: isReady ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'readiness'
        }
      })
    }
    
    // Liveness probe - GET /api/health/live
    if (pathname === '/api/health/live') {
      // Simple liveness check - is the process alive and responsive?
      const memoryCheck = await getCachedHealthCheck('memory', checkMemory)
      const isAlive = memoryCheck.status !== 'fail'
      
      const livenessStatus = {
        status: isAlive ? 'alive' : 'dead',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        memory: memoryCheck
      }
      
      return NextResponse.json(livenessStatus, {
        status: isAlive ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'liveness'
        }
      })
    }
    
    // Default response for unknown health endpoints
    return NextResponse.json(
      { error: 'Health endpoint not found' },
      { status: 404 }
    )
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'error'
        }
      }
    )
  }
}

// Health check endpoints don't support other HTTP methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}