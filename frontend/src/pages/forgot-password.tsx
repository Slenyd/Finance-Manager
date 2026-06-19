import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Failed to send reset email');
    }
  };

  if (sent) {
    return (
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>If that email exists, a reset link has been sent.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">Please check your inbox and follow the instructions.</p>
        </CardContent>
        <CardFooter>
          <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
      </CardFooter>
    </Card>
  );
}
