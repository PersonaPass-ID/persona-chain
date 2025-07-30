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

    const { phoneNumber } = JSON.parse(event.body);

    if (!phoneNumber) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Phone number is required'
        }),
      };
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid phone number format'
        }),
      };
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store verification code (in production, use DynamoDB)
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    verificationCodes.set(normalizedPhone, {
      code: verificationCode,
      expiresAt
    });

    console.log(`Phone verification code for ${phoneNumber}: ${verificationCode}`);

    // In production, send SMS via AWS SNS
    if (process.env.AWS_SNS_REGION) {
      // TODO: Implement AWS SNS SMS sending
      console.log('AWS SNS integration would send SMS here');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to phone',
        verificationId: `phone_${Date.now()}`,
        expiresIn: 600 // 10 minutes in seconds
      }),
    };

  } catch (error) {
    console.error('Phone verification start failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to start phone verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};