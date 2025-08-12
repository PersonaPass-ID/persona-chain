import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { supabaseService } from '../lib/supabase-service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const authorization = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          message: 'Authorization header required'
        }),
      };
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'persona-super-secure-jwt-secret-key';

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Find user in Supabase to ensure they still exist
    const user = await supabaseService.getUserByEmail(decoded.email);
    if (!user) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          message: 'User not found'
        }),
      };
    }

    console.log(`Token verification successful for ${maskEmail(decoded.email)}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username
        }
      }),
    };

  } catch (error) {
    console.warn(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        valid: false,
        message: 'Invalid token'
      }),
    };
  }
};

function maskEmail(email: string): string {
  if (!email.includes('@')) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : username;
  return `${maskedUsername}@${domain}`;
}