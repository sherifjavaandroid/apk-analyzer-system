// backend/gateway/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { BadRequestError } from '../middleware/errorHandler';

const router = Router();

// In a real application, this would come from a database
const users = new Map<string, any>();

/**
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            throw new BadRequestError('Email, password, and name are required');
        }

        // Check if user already exists
        const userExists = Array.from(users.values()).some(user => user.email === email);
        if (userExists) {
            throw new BadRequestError('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const userId = uuidv4();
        const newUser = {
            id: userId,
            email,
            name,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
        };

        // Store user (in a real app, this would be a database operation)
        users.set(userId, newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiration }
        );

        // Return user info and token (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        // Error handling is done by the errorHandler middleware
        throw error;
    }
});

/**
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new BadRequestError('Email and password are required');
        }

        // Find user by email
        const user = Array.from(users.values()).find(user => user.email === email);

        if (!user) {
            throw new BadRequestError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new BadRequestError('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiration }
        );

        // Return user info and token (without password)
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        // Error handling is done by the errorHandler middleware
        throw error;
    }
});

/**
 * Get current user
 */
router.get('/me', (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new BadRequestError('Authentication required');
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new BadRequestError('Invalid authentication format');
        }

        const token = parts[1];

        // Verify and decode token
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

        // Find user
        const user = users.get(decoded.userId);

        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Return user info (without password)
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
            user: userWithoutPassword,
        });
    } catch (error) {
        // Error handling is done by the errorHandler middleware
        throw error;
    }
});

export default router;