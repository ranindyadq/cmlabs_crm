"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ArrowLeft, MailOpen } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  leadId?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/notifications");
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read");
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.leadId) {
      router.push(`/lead/${notif.leadId}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-2 md:p-4 no-scrollbar flex flex-col items-center">
      <div className="w-full max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="text-[#5A4FB5] dark:text-[#CAA9FF]" />
            All Notifications
          </h1>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
          >
            <MailOpen size={16} className="text-[#5A4FB5] dark:text-[#CAA9FF]" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
        <div className="bg-white dark:bg-[#3B3285] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5A4FB5] border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Bell size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Empty</p>
              <p className="text-sm">No notifications at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group p-4 md:p-5 flex items-start gap-3 md:gap-4 transition hover:bg-gray-50 dark:hover:bg-[#2D3748] cursor-pointer ${
                    !notif.isRead ? "bg-blue-50/30 dark:bg-indigo-900/20" : ""
                  }`}
                >
                  {/* Unread Indicator */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${!notif.isRead ? "bg-[#5A4FB5]" : "bg-gray-200 dark:bg-gray-600"}`} />
                  </div>

                  {/* Info Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 md:gap-4">
                      <h3 className={`text-sm md:text-base truncate ${!notif.isRead ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-200"}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap mt-0.5">
                        {new Date(notif.createdAt).toLocaleString('en-US', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">
                      {notif.message}
                    </p>
                  </div>

                  <div className="ml-1 md:ml-2 flex-shrink-0">
                    <button 
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}