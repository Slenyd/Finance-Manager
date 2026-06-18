import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useAuth';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const logout = useLogout();

  const settingCards = [
    {
      title: 'Profile',
      description: 'Your account information',
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Appearance',
      description: 'Customize your theme',
      content: (
        <Button variant="outline" onClick={toggle}>
          {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </Button>
      ),
    },
    {
      title: 'Account',
      description: 'Manage your session',
      content: (
        <Button variant="destructive" onClick={() => logout.mutate()}>
          Sign Out
        </Button>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        {settingCards.map((card, i) => (
          <StaggerItem key={card.title} index={i}>
            <Card>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>{card.content}</CardContent>
            </Card>
          </StaggerItem>
        ))}
      </div>
    </PageTransition>
  );
}
