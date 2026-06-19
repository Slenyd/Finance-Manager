import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { authApi } from '@/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Palette, Globe, Trash2, LogOut, Moon, Sun } from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$', locale: 'en-US' },
  { value: 'EUR', label: 'EUR (\u20ac)', symbol: '\u20ac', locale: 'de-DE' },
  { value: 'GBP', label: 'GBP (\u00a3)', symbol: '\u00a3', locale: 'en-GB' },
  { value: 'JPY', label: 'JPY (\u00a5)', symbol: '\u00a5', locale: 'ja-JP' },
  { value: 'CNY', label: 'CNY (\u00a5)', symbol: '\u00a5', locale: 'zh-CN' },
  { value: 'INR', label: 'INR (\u20b9)', symbol: '\u20b9', locale: 'en-IN' },
  { value: 'ILS', label: 'ILS (\u20AA)', symbol: '\u20AA', locale: 'he-IL' },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileOpen, setProfileOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const selectedCurrency = CURRENCIES.find(c => c.value === user?.currency) || CURRENCIES[0];

  const profileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => authApi.updateProfile(data),
    onSuccess: (res) => {
      const updatedUser = res.data.data!.user;
      setUser(updatedUser);
      setProfileOpen(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: (data: { currency?: string; locale?: string }) => authApi.updatePreferences(data),
    onSuccess: (res) => {
      const updatedUser = res.data.data!.user;
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      logout.mutate();
      navigate('/login', { replace: true });
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

        <StaggerItem index={0}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
              <CardDescription>Update your name and email address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <Button variant="outline" onClick={() => { setProfileName(user?.name || ''); setProfileEmail(user?.email || ''); setProfileOpen(true); }}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setPasswordOpen(true)}>Change Password</Button>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance</CardTitle>
              <CardDescription>Customize your theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                  <span className="font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <Button variant="outline" onClick={toggle}>
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={3}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Currency & Locale</CardTitle>
              <CardDescription>Set your preferred currency for displaying amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label>Currency</Label>
                <Select
                  value={user?.currency || 'USD'}
                  onValueChange={(value) => {
                    const currency = CURRENCIES.find(c => c.value === value);
                    if (currency) {
                      preferencesMutation.mutate({ currency: currency.value, locale: currency.locale });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preferencesMutation.isPending && <p className="text-xs text-muted-foreground mt-1">Saving...</p>}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={4}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LogOut className="h-5 w-5" /> Session</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled={logout.isPending} onClick={() => { logout.mutate(); navigate('/login'); }}>{logout.isPending ? 'Signing out...' : 'Sign Out'}</Button>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={5}>
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => { setDeleteConfirm(''); setDeleteOpen(true); }}>Delete Account</Button>
            </CardContent>
          </Card>
        </StaggerItem>

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your name and email address.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate({ name: profileName, email: profileEmail }); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name <span className="text-destructive">*</span></Label>
                <Input id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email <span className="text-destructive">*</span></Label>
                <Input id="profile-email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
              </div>
              {profileMutation.isError && (
                <p className="text-sm text-destructive">{(profileMutation.error as any)?.response?.data?.message || 'Update failed'}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate({ currentPassword, newPassword, newPasswordConfirmation: confirmPassword }); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password <span className="text-destructive">*</span></Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password <span className="text-destructive">*</span></Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password <span className="text-destructive">*</span></Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
              {passwordMutation.isError && (
                <p className="text-sm text-destructive">{(passwordMutation.error as any)?.response?.data?.errors?.currentPassword?.[0] || (passwordMutation.error as any)?.response?.data?.message || 'Change failed'}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={passwordMutation.isPending || !newPassword || newPassword !== confirmPassword}>
                  {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>This action is permanent and cannot be undone. All your data will be permanently deleted.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">Type <strong>DELETE</strong> to confirm <span className="text-destructive">*</span></Label>
                <Input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
              </div>
              {deleteMutation.isError && (
                <p className="text-sm text-destructive">{(deleteMutation.error as any)?.response?.data?.message || 'Deletion failed'}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Account Permanently'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}