/**
 * SECURE LOGOUT API ENDPOINT
 * 
 * This endpoint securely logs out users by:
 * - Destroying server-side session
 * - Clearing HttpOnly cookies
 * - Logging the logout event
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedRoute, sessionUtils } from '@/middleware/session';
import { sessionManager } from '@/lib/session/secure-session-manager';

type ApiResponse = {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Logout handler
 */
async function logoutHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST for logout (prevent CSRF via GET)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      }
    });
  }

  try {
    // Get current user for logging
    const user = sessionUtils.getCurrentUser(req);
    
    if (user) {
      // Log logout event
      console.log('User logout:', {
        userId: user.userId,
        walletAddress: user.walletAddress.substring(0, 8) + '...',
        sessionAge: sessionUtils.getSessionAge(req),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date().toISOString()
      });
    }

    // Destroy session and clear cookies
    await sessionManager.destroySession(req, res);

    // Clear any additional application-specific data
    // For example, clear wallet connection state
    if (user?.walletAddress) {
      await walletAuth.logout(user.walletAddress);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, try to clear the session
    try {
      await sessionManager.destroySession(req, res);
    } catch (destroyError) {
      console.error('Failed to destroy session during error recovery:', destroyError);
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'An error occurred during logout'
      }
    });
  }
}

// Export as authenticated route (requires valid session)
export default createAuthenticatedRoute(logoutHandler);