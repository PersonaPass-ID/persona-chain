import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as bcrypt from 'bcryptjs'; // Use bcryptjs instead of bcrypt for Lambda compatibility
import * as jwt from 'jsonwebtoken';

// Simple in-memory storage for demo (in production, use DynamoDB)
const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: Date;
  verified: boolean;
}>();

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
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Request body is required'
        }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    // Validate inputs
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Email and password are required'
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }),
      };
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid email or password'
        }),
      };
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      console.warn(`Invalid password attempt for ${maskEmail(email)}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid email or password'
        }),
      };
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'persona-super-secure-jwt-secret-key';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log(`Login successful for ${maskEmail(email)}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
      }),
    };

  } catch (error) {
    console.error('Login failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Login failed. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
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