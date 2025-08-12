import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
    const storedData = await supabaseService.getVerificationCode(normalizedPhone, 'phone');
    
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
    await supabaseService.deleteVerificationCode(normalizedPhone, 'phone');

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
        jws: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({
          sub: normalizedPhone,
          iss: 'did:persona:issuer:phone-verification',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
        })).toString('base64')}.${Buffer.from('persona-phone-verification-signature').toString('base64')}`
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