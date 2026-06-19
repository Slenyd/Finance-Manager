import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordForm } from '@/schemas';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Missing reset token. Use the link from your email.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      await authApi.resetPassword(token, data.password, data.passwordConfirmation);
      setStatus('done');
    } catch {
      setError('Invalid or expired reset token');
      setStatus('error');
    }
  };

  if (!token) {
    return (
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This reset link is missing the token.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Request a new reset link</Link>
        </CardFooter>
      </Card>
    );
  }

  if (status === 'done') {
    return (
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Password reset</CardTitle>
          <CardDescription>Your password has been updated.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">You can now sign in with your new password.</p>
        </CardContent>
        <CardFooter>
          <Link to="/login" className="text-sm text-primary hover:underline">Sign in</Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="password">New password <span className="text-destructive">*</span></Label>
              {errors.password && (
                <span className="text-xs text-destructive font-medium animate-scale-in">Required</span>
              )}
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="passwordConfirmation">Confirm password <span className="text-destructive">*</span></Label>
              {errors.passwordConfirmation && (
                <span className="text-xs text-destructive font-medium animate-scale-in">Required</span>
              )}
            </div>
            <Input id="passwordConfirmation" type="password" placeholder="••••••••" {...register('passwordConfirmation')} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? <><Spinner size="sm" className="mr-2 inline-block" /> Resetting...</> : 'Reset password'}
          </Button>
          <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
        </CardFooter>
      </form>
    </Card>
  );
}
