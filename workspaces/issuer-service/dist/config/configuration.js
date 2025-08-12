"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
        expiresIn: '24h',
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        kmsKeyId: process.env.AWS_KMS_KEY_ID,
    },
    veramo: {
        dbEncryptionKey: process.env.VERAMO_DB_ENCRYPTION_KEY,
    },
    issuer: {
        did: process.env.ISSUER_DID || 'did:key:persona-issuer-dev',
        name: process.env.ISSUER_NAME || 'Persona Protocol Issuer Service',
        didSecretName: process.env.ISSUER_DID_SECRET_NAME || 'persona/issuer-did',
    },
    security: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8081',
        ],
    },
});
//# sourceMappingURL=configuration.js.map