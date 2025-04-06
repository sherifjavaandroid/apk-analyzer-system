// backend/gateway/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import { rateLimit } from 'express-rate-limit';

// Config import
import { config } from './config';

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.use('/auth', require('./routes/auth'));

// Protected routes
// APK Analyzer Service
app.use(
    '/api/apk',
    authenticate,
    createProxyMiddleware({
        target: config.services.apkAnalyzer,
        changeOrigin: true,
        pathRewrite: {
            '^/api/apk': '/api',
        },
    })
);

// GitHub Analyzer Service
app.use(
    '/api/github',
    authenticate,
    createProxyMiddleware({
        target: config.services.githubAnalyzer,
        changeOrigin: true,
        pathRewrite: {
            '^/api/github': '/api',
        },
    })
);

// AI Service
app.use(
    '/api/ai',
    authenticate,
    createProxyMiddleware({
        target: config.services.aiService,
        changeOrigin: true,
        pathRewrite: {
            '^/api/ai': '/api',
        },
    })
);

// Report Service
app.use(
    '/api/reports',
    authenticate,
    createProxyMiddleware({
        target: config.services.reportService,
        changeOrigin: true,
        pathRewrite: {
            '^/api/reports': '/api',
        },
    })
);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

export default app;