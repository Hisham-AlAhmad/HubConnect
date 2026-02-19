import { createContext, useState, useEffect, useContext } from 'react';
import { notificationAPI } from '../services/api';

// Create Notification Context
export const NotificationContext = createContext(null);

/**
 * NotificationProvider component - Manages notifications
 * Provides notification data, unread count, and mark as read functions
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const user = null;

  // Fetch notifications when user is authenticated
  useEffect(() => {
    // No notifications without backend
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = async () => {
    // No backend
  };

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   */
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  /**
   * Add new notification (for real-time updates)
   * @param {object} notification - Notification object
   */
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
