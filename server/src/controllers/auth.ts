import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db.js';

export class AuthController {
  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account created successfully.',
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
