import { Request, Response } from 'express';
import { AuthService } from '../services';
import { AuthorizedRequest, ApiResponse } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result, message: 'Registration successful' } satisfies ApiResponse);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const result = await authService.login(req.body);
    const cookieDays = req.body.rememberMe ? 30 : 1;
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: result, message: 'Login successful' } satisfies ApiResponse);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
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
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, data: null, message: 'Logged out successfully' } satisfies ApiResponse<null>);
  });

  getProfile = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const result = await authService.getProfile(req.user.id);
    res.json({ success: true, data: result.user } satisfies ApiResponse);
  });

  updateProfile = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const result = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: result.user, message: 'Profile updated' } satisfies ApiResponse);
  });

  changePassword = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'no-store');
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: null, message: 'Password changed successfully' } satisfies ApiResponse<null>);
  });

  updatePreferences = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const result = await authService.updatePreferences(req.user.id, req.body);
    res.json({ success: true, data: result.user, message: 'Preferences updated' } satisfies ApiResponse);
  });

  deleteAccount = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'no-store');
    await authService.deleteAccount(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ success: true, data: null, message: 'Account deleted successfully' } satisfies ApiResponse<null>);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: null, message: 'If the email exists, a reset link has been sent' } satisfies ApiResponse<null>);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: null, message: 'Password reset successful' } satisfies ApiResponse<null>);
  });
}