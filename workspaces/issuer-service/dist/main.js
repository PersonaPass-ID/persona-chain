"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const helmet_1 = require("helmet");
const compression = require("compression");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.useGlobalPipes(new common_2.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8081',
            /^http:\/\/192\.168\.\d+\.\d+:8081$/,
            'https://personapass.xyz',
            'https://www.personapass.xyz',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 PersonaPass Wallet-Only API running on http://localhost:${port}`);
    logger.log(`⛓️  Wallet DID Creation API: http://localhost:${port}/api/did/create`);
    logger.log(`🔍 Wallet Credentials API: http://localhost:${port}/api/credentials/:address`);
    logger.log(`✅ Health Check API: http://localhost:${port}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map