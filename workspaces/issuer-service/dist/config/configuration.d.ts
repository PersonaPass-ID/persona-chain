declare const _default: () => {
    port: number;
    nodeEnv: string;
    github: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    twilio: {
        accountSid: string;
        authToken: string;
        verifyServiceSid: string;
    };
    aws: {
        region: string;
        kmsKeyId: string;
    };
    veramo: {
        dbEncryptionKey: string;
    };
    issuer: {
        did: string;
        name: string;
        didSecretName: string;
    };
    security: {
        allowedOrigins: string[];
    };
};
export default _default;
