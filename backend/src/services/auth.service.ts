import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';
import { JwtPayload, AuthResult, RefreshResult, SafeUser, RegisterData, LoginData, UpdateProfileData, UpdatePreferencesData } from '../interfaces';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { sendPasswordResetEmail } from '../utils/mailer';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

type UserSelect = Prisma.UserGetPayload<{ select: { id: true; name: true; email: true; role: true; isVerified: true; currency: true; locale: true; createdAt: true; updatedAt: true } }>;

function toSafeUser(user: UserSelect): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    currency: user.currency,
    locale: user.locale,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: SafeUser }> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Registration failed');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.createDefaultCategories(user.id);

    return { user: toSafeUser({ ...user, currency: 'USD', locale: 'en-US' }) };
  }

  async login(data: LoginData): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.isLocked) {
      if (user.lockUntil && user.lockUntil > new Date()) {
        throw new AuthenticationError('Account is locked. Try again later.');
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, failedLoginAttempts: 0, lockUntil: null },
      });
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
      throw new AuthenticationError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0 },
    });

    const tokenFamily = uuidv4();
    const accessToken = this.generateAccessToken(user.id, user.role, { name: user.name, email: user.email, isVerified: user.isVerified });
    const refreshToken = this.generateRefreshToken(user.id, user.role, tokenFamily);
    const refreshDays = data.rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        family: tokenFamily,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        currency: user.currency,
        locale: user.locale,
      },
      rememberMe: data.rememberMe ?? false,
    };
  }

  async refresh(token: string): Promise<RefreshResult> {
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { family: storedToken.family, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new AuthenticationError('Invalid refresh token');
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
    if (!user || user.isLocked) {
      throw new AuthenticationError('User account unavailable');
    }

    const newTokenFamily = uuidv4();
    const accessToken = this.generateAccessToken(user.id, user.role, { name: user.name, email: user.email, isVerified: user.isVerified });
    const refreshToken = this.generateRefreshToken(user.id, user.role, newTokenFamily);
    const remainingMs = storedToken.expiresAt.getTime() - Date.now();
    const expiresAt = new Date(Date.now() + Math.max(remainingMs, 24 * 60 * 60 * 1000));

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        family: newTokenFamily,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<void> {
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (storedToken) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
  }

  async getProfile(userId: string): Promise<{ user: SafeUser }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        currency: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    return { user: toSafeUser(user) };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<{ user: SafeUser }> {
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email already in use');
      }
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        currency: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { user: toSafeUser(user) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError({ currentPassword: ['Current password is incorrect'] });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async updatePreferences(userId: string, data: UpdatePreferencesData): Promise<{ user: SafeUser }> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.locale !== undefined && { locale: data.locale }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        currency: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { user: toSafeUser(user) };
  }

  async deleteAccount(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires: resetExpires,
      },
    });
    await sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const updateData: Prisma.UserUpdateInput = { failedLoginAttempts: newAttempts };

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.isLocked = true;
      updateData.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });
  }

  private generateAccessToken(userId: string, role: string, extras: { name: string; email: string; isVerified: boolean }): string {
    const payload: JwtPayload = { userId, role, type: 'access', ...extras };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'y'}`,
    });
  }

  private generateRefreshToken(userId: string, role: string, family: string): string {
    const payload: JwtPayload = { userId, role, type: 'refresh', tokenFamily: family };
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'y'}`,
    });
  }

  private async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'INCOME' as const },
      { name: 'Freelance', icon: 'laptop', color: '#3b82f6', type: 'INCOME' as const },
      { name: 'Investments', icon: 'trending-up', color: '#8b5cf6', type: 'INCOME' as const },
      { name: 'Gifts', icon: 'gift', color: '#ec4899', type: 'INCOME' as const },
      { name: 'Food', icon: 'utensils', color: '#ef4444', type: 'EXPENSE' as const },
      { name: 'Transport', icon: 'car', color: '#f59e0b', type: 'EXPENSE' as const },
      { name: 'Rent', icon: 'home', color: '#6366f1', type: 'EXPENSE' as const },
      { name: 'Entertainment', icon: 'film', color: '#8b5cf6', type: 'EXPENSE' as const },
      { name: 'Utilities', icon: 'zap', color: '#eab308', type: 'EXPENSE' as const },
      { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'EXPENSE' as const },
      { name: 'Healthcare', icon: 'heart', color: '#ef4444', type: 'EXPENSE' as const },
      { name: 'Education', icon: 'book', color: '#3b82f6', type: 'EXPENSE' as const },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId,
      })),
    });
  }
}