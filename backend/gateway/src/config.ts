// backend/gateway/src/config.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
    // Server settings
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT settings
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',

    // Service endpoints
    services: {
        apkAnalyzer: process.env.APK_ANALYZER_URL || 'http://apk-analyzer:8001',
        githubAnalyzer: process.env.GITHUB_ANALYZER_URL || 'http://github-analyzer:8002',
        aiService: process.env.AI_SERVICE_URL || 'http://ai-service:8003',
        reportService: process.env.REPORT_SERVICE_URL || 'http://report-service:8004'
    },

    // CORS settings
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://localhost:3000'],

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100') // Limit each IP to 100 requests per windowMs
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'dev'
};