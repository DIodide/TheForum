"use client";

import { Bell, Check, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type NotificationItem,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "~/actions/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";

function formatTimeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationText(n: NotificationItem): string {
  switch (n.type) {
    case "friend_request":
      return `${(n.payload.fromDisplayName as string) ?? "Someone"} sent you a friend request`;
    case "event_reminder":
      return `Reminder: ${(n.payload.eventTitle as string) ?? "An event"} is coming up soon`;
    case "org_new_event":
      return `${(n.payload.orgName as string) ?? "An org"} posted a new event`;
    default:
      return "New notification";
  }
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "friend_request":
      return <UserPlus size={14} className="text-indigo-500" />;
    case "event_reminder":
      return <Bell size={14} className="text-amber-500" />;
    case "org_new_event":
      return <Bell size={14} className="text-emerald-500" />;
    default:
      return <Bell size={14} className="text-gray-400" />;
  }
}

export function NotificationDropdown() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail (user might not be authed yet)
    }
  }, []);

  // Initial fetch + polling every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        >
          <Bell size={18} className="text-gray-500" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Check size={11} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {items.length > 0 ? (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                }}
                className={cn(
                  "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                  !n.read && "bg-indigo-50/40",
                )}
              >
                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      n.read ? "text-gray-500" : "text-gray-800 font-medium",
                    )}
                  >
                    {getNotificationText(n)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="py-10 text-center">
              <Bell size={20} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
