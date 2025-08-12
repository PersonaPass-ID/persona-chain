import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { supabaseService } from '../lib/supabase-service';

const snsClient = new SNSClient({ 
  region: process.env.AWS_SNS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.SNS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SNS_SECRET_ACCESS_KEY!
  }
});

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

    // Validate phone number format (basic E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
        }),
      };
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store verification code in Supabase
    await supabaseService.storeVerificationCode(phoneNumber, verificationCode, 'phone', expiresAt);

    console.log(`SMS verification code for ${maskPhone(phoneNumber)}: ${verificationCode}`);

    // Send SMS via AWS SNS
    if (process.env.SNS_ACCESS_KEY_ID && process.env.SNS_SECRET_ACCESS_KEY) {
      try {
        const message = `Your PersonaPass verification code is: ${verificationCode}. This code expires in 10 minutes.`;
        
        const command = new PublishCommand({
          PhoneNumber: phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        });

        const result = await snsClient.send(command);
        console.log(`SMS sent successfully to ${maskPhone(phoneNumber)}, MessageId: ${result.MessageId}`);
      } catch (error) {
        console.error('Failed to send SMS:', error);
        // Don't fail the request if SMS sending fails
      }
    } else {
      console.log('AWS SNS not configured - verification code logged only');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to phone number',
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

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, -4) + '****';
}