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

    const { email, password, firstName, lastName, username } = JSON.parse(event.body);

    // Validate inputs
    if (!email || !password || !firstName || !lastName || !username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'All fields are required'
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

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Password must be at least 8 characters long'
        }),
      };
    }

    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Password must contain at least one letter and one number'
        }),
      };
    }

    // Check if user already exists
    if (users.has(email.toLowerCase())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'An account with this email already exists'
        }),
      };
    }

    // Check if username is taken
    const existingUsername = Array.from(users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
    if (existingUsername) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'This username is already taken'
        }),
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const user = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      username,
      createdAt: new Date(),
      verified: false
    };

    users.set(email.toLowerCase(), user);

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

    console.log(`Account created successfully for ${maskEmail(email)}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully',
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
    console.error('Create account failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to create account. Please try again.',
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