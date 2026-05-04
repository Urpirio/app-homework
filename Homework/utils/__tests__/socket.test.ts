/**
 * Socket Manager Unit Tests
 *
 * Tests the Socket.io client manager lifecycle, event handling,
 * message routing, and SecureStore integration.
 *
 * Validates: Requirements 2.1, 5.2, 10.3
 */

import * as SecureStore from 'expo-secure-store';

// --- Mock socket.io-client ---
const mockOn = jest.fn();
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();
const mockRemoveAllListeners = jest.fn();
let mockConnected = false;

const mockSocket = {
  get connected() {
    return mockConnected;
  },
  on: mockOn,
  emit: mockEmit,
  disconnect: mockDisconnect,
  removeAllListeners: mockRemoveAllListeners,
};

const mockIo = jest.fn().mockReturnValue(mockSocket);

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

// --- Mock expo-secure-store ---
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

// --- Mock queryClient ---
const mockInvalidateQueries = jest.fn();
jest.mock('@/utils/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  },
}));

// --- Import after mocks ---
import {
    connect,
    connectFromSecureStore,
    disconnect,
    emitTyping,
    getSocket,
    isConnected,
    joinProject,
    onNewMessage,
    onNewNotification,
    sendMessage,
} from '../socket';

describe('Socket Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnected = false;
    // Reset the module-level socket by disconnecting
    disconnect();
    jest.clearAllMocks(); // Clear mocks again after disconnect
  });

  describe('connect()', () => {
    it('creates a socket with the correct URL and auth token', () => {
      connect('test-jwt-token');

      expect(mockIo).toHaveBeenCalledWith(
        'https://app-homework-production.up.railway.app/chat',
        expect.objectContaining({
          auth: { token: 'test-jwt-token' },
          transports: ['websocket'],
        })
      );
    });

    it('configures reconnection options', () => {
      connect('token');

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        })
      );
    });

    it('registers connect, disconnect, and connect_error listeners', () => {
      connect('token');

      const registeredEvents = mockOn.mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(registeredEvents).toContain('connect');
      expect(registeredEvents).toContain('disconnect');
      expect(registeredEvents).toContain('connect_error');
    });

    it('registers newMessage, newProjectMessage, and newNotification listeners for cache invalidation', () => {
      connect('token');

      const registeredEvents = mockOn.mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(registeredEvents).toContain('newMessage');
      expect(registeredEvents).toContain('newProjectMessage');
      expect(registeredEvents).toContain('newNotification');
    });

    it('disconnects existing socket before creating a new one', () => {
      // First connect creates a socket
      connect('token-1');
      jest.clearAllMocks();

      // Now the module-level socket is set; mark it as connected
      mockConnected = true;

      // Second connect should disconnect the first socket before creating a new one
      connect('token-2');

      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { token: 'token-2' } })
      );
    });

    it('invalidates message queries on newMessage event', () => {
      connect('token');

      // Find the newMessage handler
      const newMessageCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'newMessage'
      );
      expect(newMessageCall).toBeDefined();

      // Invoke the handler
      newMessageCall![1]();

      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['messages'] })
      );
    });

    it('invalidates notification queries on newNotification event', () => {
      connect('token');

      const newNotifCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'newNotification'
      );
      expect(newNotifCall).toBeDefined();

      newNotifCall![1]();

      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['notifications'] })
      );
    });
  });

  describe('disconnect()', () => {
    it('removes all listeners and disconnects the socket', () => {
      connect('token');
      jest.clearAllMocks();

      disconnect();

      expect(mockRemoveAllListeners).toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('sets socket to null after disconnect', () => {
      connect('token');
      disconnect();

      expect(getSocket()).toBeNull();
    });

    it('does nothing if no socket exists', () => {
      // Already disconnected in beforeEach
      disconnect();

      // Should not throw
      expect(mockRemoveAllListeners).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage()', () => {
    it('emits sendMessage event for direct messages (receiverId)', () => {
      connect('token');
      mockConnected = true;

      sendMessage({ receiverId: 'user-123', text: 'Hello' });

      expect(mockEmit).toHaveBeenCalledWith('sendMessage', {
        receiverId: 'user-123',
        text: 'Hello',
      });
    });

    it('emits sendProjectMessage event for project messages (projectId)', () => {
      connect('token');
      mockConnected = true;

      sendMessage({ projectId: 'proj-456', text: 'Group hello' });

      expect(mockEmit).toHaveBeenCalledWith('sendProjectMessage', {
        projectId: 'proj-456',
        text: 'Group hello',
      });
    });

    it('prefers projectId over receiverId when both are provided', () => {
      connect('token');
      mockConnected = true;

      sendMessage({
        receiverId: 'user-123',
        projectId: 'proj-456',
        text: 'Both provided',
      });

      expect(mockEmit).toHaveBeenCalledWith('sendProjectMessage', {
        projectId: 'proj-456',
        text: 'Both provided',
      });
    });

    it('does not emit when socket is not connected', () => {
      connect('token');
      mockConnected = false;

      sendMessage({ receiverId: 'user-123', text: 'Hello' });

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('does not emit when neither receiverId nor projectId is provided', () => {
      connect('token');
      mockConnected = true;

      sendMessage({ text: 'No target' });

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('joinProject()', () => {
    it('emits joinProject event with the project ID', () => {
      connect('token');
      mockConnected = true;

      joinProject('proj-789');

      expect(mockEmit).toHaveBeenCalledWith('joinProject', {
        projectId: 'proj-789',
      });
    });

    it('does not emit when socket is not connected', () => {
      connect('token');
      mockConnected = false;

      joinProject('proj-789');

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('emitTyping()', () => {
    it('emits typing event with target', () => {
      connect('token');
      mockConnected = true;

      emitTyping({ receiverId: 'user-123' });

      expect(mockEmit).toHaveBeenCalledWith('typing', {
        receiverId: 'user-123',
      });
    });

    it('does not emit when socket is not connected', () => {
      connect('token');
      mockConnected = false;

      emitTyping({ receiverId: 'user-123' });

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('onNewMessage()', () => {
    it('registers a callback for newMessage events', () => {
      connect('token');
      jest.clearAllMocks();

      const callback = jest.fn();
      onNewMessage(callback);

      expect(mockOn).toHaveBeenCalledWith('newMessage', callback);
    });
  });

  describe('onNewNotification()', () => {
    it('registers a callback for newNotification events', () => {
      connect('token');
      jest.clearAllMocks();

      const callback = jest.fn();
      onNewNotification(callback);

      expect(mockOn).toHaveBeenCalledWith('newNotification', callback);
    });
  });

  describe('connectFromSecureStore()', () => {
    it('reads token from SecureStore and connects', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        'stored-jwt-token'
      );

      const result = await connectFromSecureStore();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'stored-jwt-token' },
        })
      );
      expect(result).toBe(true);
    });

    it('returns false when no token is stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await connectFromSecureStore();

      expect(result).toBe(false);
      expect(mockIo).not.toHaveBeenCalled();
    });

    it('returns false when SecureStore throws an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore unavailable')
      );

      const result = await connectFromSecureStore();

      expect(result).toBe(false);
      expect(mockIo).not.toHaveBeenCalled();
    });
  });

  describe('isConnected()', () => {
    it('returns false when no socket exists', () => {
      expect(isConnected()).toBe(false);
    });

    it('returns the socket connected state', () => {
      connect('token');
      mockConnected = true;

      expect(isConnected()).toBe(true);
    });
  });

  describe('getSocket()', () => {
    it('returns null when no socket exists', () => {
      expect(getSocket()).toBeNull();
    });

    it('returns the socket instance after connect', () => {
      connect('token');

      expect(getSocket()).toBe(mockSocket);
    });
  });
});
