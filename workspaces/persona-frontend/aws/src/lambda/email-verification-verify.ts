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

    const { email, verificationCode } = JSON.parse(event.body);

    if (!email || !verificationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Email and verification code are required'
        }),
      };
    }

    // Check stored verification code
    const storedData = verificationCodes.get(email.toLowerCase());
    
    if (!storedData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'No verification code found for this email'
        }),
      };
    }

    // Check if code is expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Verification code has expired'
        }),
      };
    }

    // Check if code matches
    if (storedData.code !== verificationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid verification code'
        }),
      };
    }

    // Remove used verification code
    verificationCodes.delete(email.toLowerCase());

    // Create email verification credential
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://persona-hq.com/context/v1'
      ],
      id: `urn:uuid:email-vc-${Date.now()}`,
      type: ['VerifiableCredential', 'EmailVerificationCredential'],
      issuer: {
        id: 'did:persona:issuer:email-verification',
        name: 'PersonaPass Email Verification Service'
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      credentialSubject: {
        id: `did:persona:email:${Buffer.from(email.toLowerCase()).toString('base64').substring(0, 16)}`,
        email: email.toLowerCase(),
        emailHashed: Buffer.from(email.toLowerCase()).toString('base64'),
        verificationMethod: 'email-otp',
        verificationTimestamp: new Date().toISOString()
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        verificationMethod: 'did:persona:issuer:email-verification#key-1',
        proofPurpose: 'assertionMethod',
        jws: `mock-signature-${Date.now()}` // In production, use real cryptographic signature
      }
    };

    console.log(`Email verification successful for ${email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email verification successful',
        credential
      }),
    };

  } catch (error) {
    console.error('Email verification failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Email verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};