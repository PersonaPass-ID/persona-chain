"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationSchema = void 0;
const Joi = require("joi");
exports.configurationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3001),
    GITHUB_CLIENT_ID: Joi.string().required(),
    GITHUB_CLIENT_SECRET: Joi.string().required(),
    GITHUB_REDIRECT_URI: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    TWILIO_ACCOUNT_SID: Joi.string().optional(),
    TWILIO_AUTH_TOKEN: Joi.string().optional(),
    TWILIO_VERIFY_SERVICE_SID: Joi.string().optional(),
    AWS_REGION: Joi.string().default('us-east-1'),
    AWS_KMS_KEY_ID: Joi.string().required(),
    ISSUER_DID_SECRET_NAME: Joi.string().default('persona/issuer-did'),
    VERAMO_DB_ENCRYPTION_KEY: Joi.string().length(32).required(),
    ISSUER_DID: Joi.string().required(),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),
});
//# sourceMappingURL=configuration.schema.js.map