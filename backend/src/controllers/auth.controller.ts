import { Request, Response } from 'express';
import { AuthService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result, message: 'Registration successful' });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    const cookieDays = req.body.rememberMe ? 30 : 1;
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: result, message: 'Login successful' });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new BadRequestError('No refresh token');
    }
    const result = await authService.refresh(token);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: result });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.getProfile(req.user!.id);
    res.json({ success: true, data: result });
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: result, message: 'Profile updated' });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  });

  updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.updatePreferences(req.user!.id, req.body);
    res.json({ success: true, data: result, message: 'Preferences updated' });
  });

  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await authService.deleteAccount(req.user!.id);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Account deleted successfully' });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Password reset successful' });
  });
}