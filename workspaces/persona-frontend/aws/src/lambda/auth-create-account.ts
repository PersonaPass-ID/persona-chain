import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { supabaseService } from '../lib/supabase-service';

// User interface for Supabase
interface UserAccount {
  id?: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  username: string;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

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
    const existingUser = await supabaseService.getUserByEmail(email);
    if (existingUser) {
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
    const existingUsername = await supabaseService.getUserByUsername(username);
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
    
    // Create user in Supabase
    const userData: UserAccount = {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      username,
      verified: false
    };

    const user = await supabaseService.createUserAccount(userData);

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
          firstName: user.first_name,
          lastName: user.last_name,
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