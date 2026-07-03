import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useApiData";
import { Bell, Heart, Gift, Coins, Award, Megaphone, Cake } from "lucide-react";

const iconByType: Record<string, typeof Heart> = {
  appreciation: Heart,
  reward: Gift,
  points: Coins,
  award: Award,
  announcement: Megaphone,
  birthday: Cake,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notifications
            {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0 divide-y divide-border">
          {isLoading && <p className="p-6 text-center text-muted-foreground">Loading notifications...</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="p-6 text-center text-muted-foreground">No notifications yet.</p>
          )}
          {notifications.map((n) => {
            const Icon = iconByType[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <div className="rounded-lg p-2 bg-primary/10 text-primary flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
