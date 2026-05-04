/**
 * Socket.io Client Manager
 *
 * Manages the WebSocket connection to the backend /chat namespace
 * with JWT authentication from SecureStore. Integrates with React Query
 * cache invalidation for real-time message and notification updates.
 *
 * Validates: Requirements 2.1, 5.2, 10.3
 */

import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

import { messageKeys } from '../hooks/api/useMessages';
import { notificationKeys } from '../hooks/api/useNotifications';
import type { ChatMessage } from '../types/message';
import type { AppNotification } from '../types/notification';
import { queryClient } from './queryClient';

const SOCKET_URL = 'https://app-homework-production.up.railway.app/chat';

export interface SocketManager {
  connect(token: string): void;
  disconnect(): void;
  onNewMessage(callback: (msg: ChatMessage) => void): void;
  onNewNotification(callback: (notif: AppNotification) => void): void;
  sendMessage(data: { receiverId?: string; projectId?: string; text: string }): void;
  joinProject(projectId: string): void;
  emitTyping(target: { receiverId?: string; projectId?: string }): void;
}

let socket: Socket | null = null;

/**
 * Connect to the Socket.io /chat namespace with JWT auth.
 * If already connected, disconnects first to avoid duplicate connections.
 */
export function connect(token: string): void {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to /chat namespace');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  // Invalidate React Query caches on real-time events
  socket.on('newMessage', () => {
    queryClient.invalidateQueries({ queryKey: messageKeys.all });
    queryClient.refetchQueries({ queryKey: messageKeys.all });
  });

  socket.on('newProjectMessage', () => {
    queryClient.invalidateQueries({ queryKey: messageKeys.all });
    queryClient.refetchQueries({ queryKey: messageKeys.all });
  });

  socket.on('newNotification', () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  });
}

/**
 * Disconnect from the Socket.io server and clean up.
 */
export function disconnect(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Register a callback for incoming direct messages.
 * The callback receives the full ChatMessage object from the server.
 */
export function onNewMessage(callback: (msg: ChatMessage) => void): void {
  socket?.on('newMessage', callback);
}

/**
 * Register a callback for incoming project/group messages.
 */
export function onNewProjectMessage(callback: (msg: ChatMessage) => void): void {
  socket?.on('newProjectMessage', callback);
}

/**
 * Register a callback for incoming notifications.
 */
export function onNewNotification(callback: (notif: AppNotification) => void): void {
  socket?.on('newNotification', callback);
}

/**
 * Send a message via the socket. Routes to the correct event
 * based on whether receiverId or projectId is provided.
 */
export function sendMessage(data: {
  receiverId?: string;
  projectId?: string;
  text: string;
}): void {
  if (!socket?.connected) {
    console.warn('[Socket] Cannot send message: not connected');
    return;
  }

  if (data.projectId) {
    socket.emit('sendProjectMessage', {
      projectId: data.projectId,
      text: data.text,
    });
  } else if (data.receiverId) {
    socket.emit('sendMessage', {
      receiverId: data.receiverId,
      text: data.text,
    });
  }
}

/**
 * Join a project room to receive group messages for that project.
 */
export function joinProject(projectId: string): void {
  if (!socket?.connected) {
    console.warn('[Socket] Cannot join project: not connected');
    return;
  }

  socket.emit('joinProject', { projectId });
}

/**
 * Emit a typing indicator to the target user or project room.
 */
export function emitTyping(target: {
  receiverId?: string;
  projectId?: string;
}): void {
  if (!socket?.connected) return;

  socket.emit('typing', target);
}

/**
 * Emit a stop-typing indicator to the target user or project room.
 */
export function emitStopTyping(target: {
  receiverId?: string;
  projectId?: string;
}): void {
  if (!socket?.connected) return;

  socket.emit('stopTyping', target);
}

/**
 * Register a callback for typing indicators from other users.
 */
export function onTyping(callback: (data: { userId: string; projectId?: string }) => void): void {
  socket?.on('userTyping', callback);
}

/**
 * Register a callback for stop-typing indicators from other users.
 */
export function onStopTyping(callback: (data: { userId: string; projectId?: string }) => void): void {
  socket?.on('userStopTyping', callback);
}

/**
 * Convenience method: connect using the JWT token stored in SecureStore.
 * Returns true if a token was found and connection was initiated.
 */
export async function connectFromSecureStore(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      console.warn('[Socket] No token in SecureStore, skipping connection');
      return false;
    }
    connect(token);
    return true;
  } catch (error) {
    console.error('[Socket] Failed to read token from SecureStore:', error);
    return false;
  }
}

/**
 * Check whether the socket is currently connected.
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Get the underlying socket instance (for advanced use or testing).
 */
export function getSocket(): Socket | null {
  return socket;
}

const socketManager: SocketManager = {
  connect,
  disconnect,
  onNewMessage,
  onNewNotification,
  sendMessage,
  joinProject,
  emitTyping,
};

export default socketManager;
