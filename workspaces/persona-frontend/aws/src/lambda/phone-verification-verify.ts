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

    const { phoneNumber, verificationCode } = JSON.parse(event.body);

    if (!phoneNumber || !verificationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Phone number and verification code are required'
        }),
      };
    }

    // Check stored verification code
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    const storedData = verificationCodes.get(normalizedPhone);
    
    if (!storedData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'No verification code found for this phone number'
        }),
      };
    }

    // Check if code is expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(normalizedPhone);
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
    verificationCodes.delete(normalizedPhone);

    // Create phone verification credential
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://persona-hq.com/context/v1'
      ],
      id: `urn:uuid:phone-vc-${Date.now()}`,
      type: ['VerifiableCredential', 'PhoneVerificationCredential'],
      issuer: {
        id: 'did:persona:issuer:phone-verification',
        name: 'PersonaPass Phone Verification Service'
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      credentialSubject: {
        id: `did:persona:phone:${Buffer.from(normalizedPhone).toString('base64').substring(0, 16)}`,
        phoneNumber: normalizedPhone,
        phoneNumberHashed: Buffer.from(normalizedPhone).toString('base64'),
        verificationMethod: 'sms-otp',
        verificationTimestamp: new Date().toISOString(),
        countryCode: normalizedPhone.startsWith('+1') ? 'US' : 'unknown'
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        verificationMethod: 'did:persona:issuer:phone-verification#key-1',
        proofPurpose: 'assertionMethod',
        jws: `mock-signature-${Date.now()}` // In production, use real cryptographic signature
      }
    };

    console.log(`Phone verification successful for ${phoneNumber}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Phone verification successful',
        credential
      }),
    };

  } catch (error) {
    console.error('Phone verification failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Phone verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};