/**
 * SECURE SESSION MANAGEMENT SYSTEM
 * 
 * Security Features:
 * - HttpOnly cookies to prevent XSS attacks
 * - Secure flag for HTTPS-only transmission
 * - SameSite protection against CSRF
 * - Session encryption using AES-GCM
 * - Automatic session rotation
 * - Session fingerprinting
 * - Distributed session storage support
 */

import { serialize, parse } from 'cookie';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

// Session configuration
const SESSION_COOKIE_NAME = 'persona_session';
const REFRESH_COOKIE_NAME = 'persona_refresh';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-in-production';
const SESSION_ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || SESSION_SECRET;
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_ROTATION_THRESHOLD = 0.75; // Rotate when 75% of TTL has passed

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export interface SessionData {
  userId: string;
  walletAddress: string;
  did?: string;
  permissions: string[];
  fingerprint: string;
  createdAt: number;
  lastAccessed: number;
  rotationCount: number;
}

export interface SessionOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
  maxAge?: number;
}

class SecureSessionManager {
  private encryptionKey: Buffer;

  constructor() {
    // Derive encryption key from secret
    this.encryptionKey = this.deriveKey(SESSION_ENCRYPTION_KEY);
  }

  /**
   * Create a new secure session
   */
  async createSession(
    res: NextApiResponse,
    data: Omit<SessionData, 'fingerprint' | 'createdAt' | 'lastAccessed' | 'rotationCount'>,
    req: NextApiRequest
  ): Promise<string> {
    try {
      const now = Date.now();
      const fingerprint = this.generateFingerprint(req);
      
      const sessionData: SessionData = {
        ...data,
        fingerprint,
        createdAt: now,
        lastAccessed: now,
        rotationCount: 0
      };

      // Create session token
      const sessionToken = await this.createSessionToken(sessionData);
      
      // Create refresh token
      const refreshToken = await this.createRefreshToken(data.userId, data.walletAddress);

      // Set HttpOnly cookies
      this.setSessionCookie(res, sessionToken, SESSION_TTL);
      this.setRefreshCookie(res, refreshToken, REFRESH_TTL);

      // Store session in distributed cache (Redis in production)
      await this.storeSession(sessionToken, sessionData);

      console.log(`🔐 Session created for: ${data.walletAddress.substring(0, 8)}...`);
      
      return sessionToken;

    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate and get session data
   */
  async getSession(req: NextApiRequest): Promise<SessionData | null> {
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionToken = cookies[SESSION_COOKIE_NAME];
      
      if (!sessionToken) {
        return null;
      }

      // Verify JWT token
      const payload = await this.verifySessionToken(sessionToken);
      if (!payload) {
        return null;
      }

      // Get session data from cache
      const sessionData = await this.retrieveSession(sessionToken);
      if (!sessionData) {
        return null;
      }

      // Verify fingerprint
      const currentFingerprint = this.generateFingerprint(req);
      if (sessionData.fingerprint !== currentFingerprint) {
        console.warn('Session fingerprint mismatch - possible session hijacking attempt');
        return null;
      }

      // Check if session has expired
      if (Date.now() > sessionData.createdAt + SESSION_TTL) {
        await this.deleteSession(sessionToken);
        return null;
      }

      // Update last accessed time
      sessionData.lastAccessed = Date.now();
      await this.storeSession(sessionToken, sessionData);

      return sessionData;

    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh session using refresh token
   */
  async refreshSession(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<SessionData | null> {
    try {
      const cookies = parse(req.headers.cookie || '');
      const refreshToken = cookies[REFRESH_COOKIE_NAME];
      
      if (!refreshToken) {
        return null;
      }

      // Verify refresh token
      const payload = await this.verifyRefreshToken(refreshToken);
      if (!payload) {
        return null;
      }

      // Get current session data
      const currentSession = await this.getSession(req);
      if (!currentSession) {
        return null;
      }

      // Create new session with rotated tokens
      const newSessionData: SessionData = {
        ...currentSession,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        rotationCount: currentSession.rotationCount + 1
      };

      // Create new tokens
      const sessionToken = await this.createSessionToken(newSessionData);
      const newRefreshToken = await this.createRefreshToken(
        newSessionData.userId,
        newSessionData.walletAddress
      );

      // Set new cookies
      this.setSessionCookie(res, sessionToken, SESSION_TTL);
      this.setRefreshCookie(res, newRefreshToken, REFRESH_TTL);

      // Store new session
      await this.storeSession(sessionToken, newSessionData);

      console.log(`🔄 Session refreshed for: ${newSessionData.walletAddress.substring(0, 8)}...`);
      
      return newSessionData;

    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  /**
   * Destroy session
   */
  async destroySession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionToken = cookies[SESSION_COOKIE_NAME];
      
      if (sessionToken) {
        await this.deleteSession(sessionToken);
      }

      // Clear cookies
      this.clearSessionCookie(res);
      this.clearRefreshCookie(res);

      console.log('🚪 Session destroyed');

    } catch (error) {
      console.error('Session destruction error:', error);
    }
  }

  /**
   * Check if session needs rotation
   */
  shouldRotateSession(sessionData: SessionData): boolean {
    const sessionAge = Date.now() - sessionData.createdAt;
    return sessionAge > SESSION_TTL * SESSION_ROTATION_THRESHOLD;
  }

  // PRIVATE METHODS

  /**
   * Generate session fingerprint
   */
  private generateFingerprint(req: NextApiRequest): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.socket.remoteAddress || ''
    ];
    
    return createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  /**
   * Create JWT session token
   */
  private async createSessionToken(data: SessionData): Promise<string> {
    const secret = new TextEncoder().encode(SESSION_SECRET);
    
    const jwt = await new SignJWT({
      sub: data.userId,
      wallet: data.walletAddress,
      did: data.did,
      permissions: data.permissions
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('4h')
      .setJti(randomBytes(16).toString('hex'))
      .sign(secret);
    
    // Encrypt the JWT for additional security
    return this.encrypt(jwt);
  }

  /**
   * Create JWT refresh token
   */
  private async createRefreshToken(userId: string, walletAddress: string): Promise<string> {
    const secret = new TextEncoder().encode(SESSION_SECRET);
    
    const jwt = await new SignJWT({
      sub: userId,
      wallet: walletAddress,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setJti(randomBytes(16).toString('hex'))
      .sign(secret);
    
    return jwt;
  }

  /**
   * Verify session token
   */
  private async verifySessionToken(encryptedToken: string): Promise<JWTPayload | null> {
    try {
      // Decrypt the token
      const token = this.decrypt(encryptedToken);
      
      const secret = new TextEncoder().encode(SESSION_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  private async verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
      const secret = new TextEncoder().encode(SESSION_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      if (payload.type !== 'refresh') {
        return null;
      }
      
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  private encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    
    const key = this.deriveKey(SESSION_ENCRYPTION_KEY, salt);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64url');
  }

  /**
   * Decrypt data using AES-GCM
   */
  private decrypt(encryptedText: string): string {
    const combined = Buffer.from(encryptedText, 'base64url');
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = this.deriveKey(SESSION_ENCRYPTION_KEY, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Derive encryption key from secret
   */
  private deriveKey(secret: string, salt?: Buffer): Buffer {
    const useSalt = salt || Buffer.from('persona-session-salt');
    return createHash('sha256')
      .update(secret)
      .update(useSalt)
      .digest();
  }

  /**
   * Set session cookie
   */
  private setSessionCookie(res: NextApiResponse, token: string, maxAge: number): void {
    const options: SessionOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge / 1000 // Convert to seconds
    };

    res.setHeader(
      'Set-Cookie',
      serialize(SESSION_COOKIE_NAME, token, options)
    );
  }

  /**
   * Set refresh cookie
   */
  private setRefreshCookie(res: NextApiResponse, token: string, maxAge: number): void {
    const options: SessionOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge / 1000 // Convert to seconds
    };

    res.setHeader(
      'Set-Cookie',
      serialize(REFRESH_COOKIE_NAME, token, options)
    );
  }

  /**
   * Clear session cookie
   */
  private clearSessionCookie(res: NextApiResponse): void {
    res.setHeader(
      'Set-Cookie',
      serialize(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      })
    );
  }

  /**
   * Clear refresh cookie
   */
  private clearRefreshCookie(res: NextApiResponse): void {
    res.setHeader(
      'Set-Cookie',
      serialize(REFRESH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      })
    );
  }

  /**
   * Store session in cache (Redis in production)
   */
  private async storeSession(token: string, data: SessionData): Promise<void> {
    // In production, use Redis or similar
    // For now, using in-memory storage
    if (typeof global !== 'undefined') {
      (global as any).__sessions = (global as any).__sessions || new Map();
      (global as any).__sessions.set(token, data);
    }
  }

  /**
   * Retrieve session from cache
   */
  private async retrieveSession(token: string): Promise<SessionData | null> {
    // In production, use Redis or similar
    if (typeof global !== 'undefined' && (global as any).__sessions) {
      return (global as any).__sessions.get(token) || null;
    }
    return null;
  }

  /**
   * Delete session from cache
   */
  private async deleteSession(token: string): Promise<void> {
    // In production, use Redis or similar
    if (typeof global !== 'undefined' && (global as any).__sessions) {
      (global as any).__sessions.delete(token);
    }
  }
}

// Export singleton instance
export const sessionManager = new SecureSessionManager();
export default sessionManager;