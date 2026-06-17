import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.getAll();
      return { data: res.data.data!, unreadCount: res.data.meta?.unreadCount || 0 };
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {data && data.unreadCount > 0 && (
              <Badge>{data.unreadCount} unread</Badge>
            )}
          </div>
          <Button variant="outline" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        </div>

        <StaggerItem index={0}>
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4"><Skeleton className="h-16 w-full animate-pulse-soft" /></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.data.map((notification, i) => (
                    <div
                      key={notification.id}
                      className={`flex items-start justify-between p-4 rounded-lg border animate-slide-up ${!notification.isRead ? 'bg-muted/50' : ''}`}
                      style={{ animationDelay: `${50 + i * 60}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex gap-3">
                        <Bell className={`h-5 w-5 mt-0.5 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(notification.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!data?.data || data.data.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No notifications</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
