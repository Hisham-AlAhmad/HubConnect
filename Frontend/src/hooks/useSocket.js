import { useState, useEffect, useRef } from 'react';
import { MockSocket } from '../services/socket';
import { useAuth } from './useAuth';

/**
 * Custom hook for Socket.io functionality
 * Manages socket connection and provides methods for sending/receiving messages
 * @param {string} roomId - Chat room ID (usually teamId)
 * @returns {object} Socket state and methods
 */
export const useSocket = (roomId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !roomId) return;

    // Create mock socket instance
    const socket = new MockSocket(user.id, user.name);
    socketRef.current = socket;

    // Connect to socket
    socket.connect();
    setConnected(true);

    // Join room
    socket.emit('join_room', { roomId });

    // Listen for events
    socket.on('room_joined', (data) => {
      setMessages(data.messages || []);
      setOnlineUsers(data.users || []);
    });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user_online', (data) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.id === data.userId)) return prev;
        return [...prev, { id: data.userId, name: data.userName, online: true }];
      });
    });

    socket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    socket.on('user_typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          if (prev.find(u => u.id === data.userId)) return prev;
          return [...prev, { id: data.userId, name: data.userName }];
        });
      }
    });

    socket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', { roomId });
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, roomId]);

  /**
   * Send message to chat room
   * @param {string} message - Message text
   */
  const sendMessage = (message) => {
    if (!socketRef.current || !message.trim()) return;

    socketRef.current.emit('send_message', {
      roomId,
      message: message.trim()
    });

    // Stop typing indicator
    stopTyping();
  };

  /**
   * Send typing indicator
   */
  const startTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('typing', { roomId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  /**
   * Stop typing indicator
   */
  const stopTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('stop_typing', { roomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return {
    messages,
    onlineUsers,
    typingUsers,
    connected,
    sendMessage,
    startTyping,
    stopTyping
  };
};

export default useSocket;
