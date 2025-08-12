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

    // Store verification code in Supabase
    await supabaseService.storeVerificationCode(email.toLowerCase(), verificationCode, 'email', expiresAt);

    console.log(`Email verification code for ${email}: ${verificationCode}`);

    // Send email via SendGrid
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'not-configured') {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@personapass.xyz',
            name: 'PersonaPass'
          },
          subject: 'PersonaPass Email Verification',
          text: `Your PersonaPass verification code is: ${verificationCode}. This code expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">PersonaPass Email Verification</h2>
              <p>Your verification code is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
                ${verificationCode}
              </div>
              <p style="color: #6b7280;">This code expires in 10 minutes.</p>
              <p style="color: #6b7280;">If you didn't request this verification, please ignore this email.</p>
            </div>
          `
        };

        await sgMail.send(msg);
        console.log(`Email sent successfully to ${email}`);
      } catch (error) {
        console.error('Failed to send email:', error);
        // Don't fail the request if email sending fails
      }
    } else {
      console.log('SendGrid not configured - verification code logged only');
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