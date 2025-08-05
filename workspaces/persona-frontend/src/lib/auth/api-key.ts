// API Key Management for PersonaPass Merchants

import { createHash, randomBytes } from 'crypto';

// Mock merchant database - in production use real database
const merchants = new Map<string, Merchant>();

export interface Merchant {
  id: string;
  email: string;
  company?: string;
  apiKey: string;
  apiKeyHash: string;
  stripeCustomerId: string;
  hasPaymentMethod: boolean;
  plan: 'starter' | 'growth' | 'enterprise';
  createdAt: Date;
  usageCount: number;
}

// Generate a new API key
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const prefix = environment === 'live' ? 'pk_live_' : 'pk_test_';
  const randomPart = randomBytes(24).toString('hex');
  return prefix + randomPart;
}

// Hash API key for storage
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

// Verify API key and return merchant info
export async function verifyApiKey(apiKey?: string | null): Promise<Merchant | null> {
  if (!apiKey || (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_'))) {
    return null;
  }

  const keyHash = hashApiKey(apiKey);
  
  // In production, query database by API key hash
  // For demo, check mock data
  for (const merchant of merchants.values()) {
    if (merchant.apiKeyHash === keyHash) {
      // Increment usage count
      merchant.usageCount++;
      return merchant;
    }
  }

  return null;
}

// Create a new merchant account
export async function createMerchant(
  email: string,
  company?: string
): Promise<Merchant> {
  const apiKey = generateApiKey('live');
  const merchant: Merchant = {
    id: `merchant_${Date.now()}`,
    email,
    company,
    apiKey,
    apiKeyHash: hashApiKey(apiKey),
    stripeCustomerId: `cus_${randomBytes(8).toString('hex')}`,
    hasPaymentMethod: false,
    plan: 'starter',
    createdAt: new Date(),
    usageCount: 0
  };

  // Store merchant (in production, save to database)
  merchants.set(merchant.id, merchant);

  return merchant;
}

// Get merchant by ID
export async function getMerchant(merchantId: string): Promise<Merchant | null> {
  return merchants.get(merchantId) || null;
}

// Update merchant plan
export async function updateMerchantPlan(
  merchantId: string,
  plan: 'starter' | 'growth' | 'enterprise'
): Promise<boolean> {
  const merchant = merchants.get(merchantId);
  if (!merchant) return false;

  merchant.plan = plan;
  return true;
}

// Record API usage for billing
export async function recordApiUsage(
  apiKey: string,
  endpoint: string,
  success: boolean
): Promise<void> {
  const merchant = await verifyApiKey(apiKey);
  if (!merchant) return;

  // In production, save to database with timestamp
  // This data is used for usage-based billing
  console.log(`API Usage: ${merchant.id} - ${endpoint} - ${success ? 'success' : 'failed'}`);
}

// Get API usage statistics
export async function getApiUsageStats(
  merchantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  endpoints: Record<string, number>;
}> {
  // In production, query from database
  // For demo, return mock data
  return {
    totalRequests: 1247,
    successfulRequests: 1228,
    failedRequests: 19,
    endpoints: {
      '/api/v1/verification/sessions': 1100,
      '/api/v1/verification/sessions/[id]': 147
    }
  };
}

// Rotate API key
export async function rotateApiKey(merchantId: string): Promise<string | null> {
  const merchant = merchants.get(merchantId);
  if (!merchant) return null;

  const newApiKey = generateApiKey('live');
  merchant.apiKey = newApiKey;
  merchant.apiKeyHash = hashApiKey(newApiKey);

  return newApiKey;
}

// Demo: Create a test merchant
if (process.env.NODE_ENV === 'development') {
  const testMerchant = {
    id: 'merchant_test',
    email: 'demo@personapass.xyz',
    company: 'Demo Store',
    apiKey: 'pk_live_1234567890abcdef',
    apiKeyHash: hashApiKey('pk_live_1234567890abcdef'),
    stripeCustomerId: 'cus_test123',
    hasPaymentMethod: true,
    plan: 'starter' as const,
    createdAt: new Date(),
    usageCount: 1247
  };
  merchants.set(testMerchant.id, testMerchant);
}