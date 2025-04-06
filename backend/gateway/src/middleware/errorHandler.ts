// backend/gateway/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    details?: any;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
    const details = err.details || null;

    // Don't expose stack traces in production
    const stack = process.env.NODE_ENV === 'production' ? null : err.stack;

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        details,
        stack,
        path: req.path,
        timestamp: new Date().toISOString(),
    });
};

// Helper function to create custom errors
export class CustomError extends Error {
    statusCode: number;
    details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common HTTP errors
export class NotFoundError extends CustomError {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, 404, details);
    }
}

export class BadRequestError extends CustomError {
    constructor(message: string = 'Bad request', details?: any) {
        super(message, 400, details);
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message: string = 'Unauthorized', details?: any) {
        super(message, 401, details);
    }
}

export class ForbiddenError extends CustomError {
    constructor(message: string = 'Forbidden', details?: any) {
        super(message, 403, details);
    }
}