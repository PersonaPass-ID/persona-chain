import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Simple in-memory storage for demo (in production, use DynamoDB)
const verificationCodes = new Map<string, {
  code: string;
  expiresAt: Date;
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

    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Email is required'
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

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store verification code (in production, use DynamoDB)
    verificationCodes.set(email.toLowerCase(), {
      code: verificationCode,
      expiresAt
    });

    console.log(`Email verification code for ${email}: ${verificationCode}`);

    // In production, send email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      // TODO: Implement SendGrid email sending
      console.log('SendGrid integration would send email here');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to email',
        verificationId: `email_${Date.now()}`,
        expiresIn: 600 // 10 minutes in seconds
      }),
    };

  } catch (error) {
    console.error('Email verification start failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to start email verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};