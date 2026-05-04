import { AppState } from 'react-native';

// --- Mocks (must be set up before imports) ---
// Use inline implementations to avoid hoisting issues with module-level calls

const mockProcessQueue = jest.fn();
const mockGetQueueCount = jest.fn();
jest.mock('../offlineQueue', () => ({
  processQueue: (...args: unknown[]) => mockProcessQueue(...args),
  getQueueCount: (...args: unknown[]) => mockGetQueueCount(...args),
}));

const mockApiGet = jest.fn();
jest.mock('../api', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockApiGet(...args) },
}));

const mockNetInfoAddEventListener = jest.fn();
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (...args: unknown[]) => mockNetInfoAddEventListener(...args),
}));

const mockRegisterTaskAsync = jest.fn();
const mockUnregisterTaskAsync = jest.fn();
const mockIsTaskRegisteredAsync = jest.fn();
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: (...args: unknown[]) => mockRegisterTaskAsync(...args),
  unregisterTaskAsync: (...args: unknown[]) => mockUnregisterTaskAsync(...args),
  BackgroundFetchResult: { NewData: 2, Failed: 1 },
}));

// Store the task callback so we can invoke it in tests.
// Use a container object so the mock factory closure captures a stable reference.
const taskStore: { callback: ((...args: unknown[]) => unknown) | null } = { callback: null };

jest.mock('expo-task-manager', () => ({
  defineTask: (name: string, cb: (...args: unknown[]) => unknown) => {
    taskStore.callback = cb;
  },
  isTaskRegisteredAsync: (...args: unknown[]) => mockIsTaskRegisteredAsync(...args),
}));

// Now import the module under test
import {
    BACKGROUND_SYNC_TASK,
    registerBackgroundSync,
    runSyncCycle,
    subscribeToAppState,
    subscribeToConnectivity,
    unregisterBackgroundSync,
} from '../backgroundSync';

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// runSyncCycle
// ---------------------------------------------------------------------------

describe('runSyncCycle', () => {
  it('processes the queue when items exist', async () => {
    mockGetQueueCount.mockResolvedValue(3);
    mockProcessQueue.mockResolvedValue(3);
    mockApiGet.mockResolvedValue({ data: [] });

    await runSyncCycle();

    expect(mockProcessQueue).toHaveBeenCalled();
    expect(mockApiGet).toHaveBeenCalledWith('/notifications', {
      params: { unreadOnly: true, limit: 1 },
    });
  });

  it('skips queue processing when queue is empty', async () => {
    mockGetQueueCount.mockResolvedValue(0);
    mockApiGet.mockResolvedValue({ data: [] });

    await runSyncCycle();

    expect(mockProcessQueue).not.toHaveBeenCalled();
  });

  it('does not throw when queue processing fails', async () => {
    mockGetQueueCount.mockResolvedValue(1);
    mockProcessQueue.mockRejectedValue(new Error('fail'));
    mockApiGet.mockResolvedValue({ data: [] });

    await expect(runSyncCycle()).resolves.toBeUndefined();
  });

  it('does not throw when notification prefetch fails', async () => {
    mockGetQueueCount.mockResolvedValue(0);
    mockApiGet.mockRejectedValue(new Error('network'));

    await expect(runSyncCycle()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// registerBackgroundSync / unregisterBackgroundSync
// ---------------------------------------------------------------------------

describe('registerBackgroundSync', () => {
  it('registers the task when not already registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(false);

    await registerBackgroundSync();

    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(
      BACKGROUND_SYNC_TASK,
      expect.objectContaining({ minimumInterval: 900 })
    );
  });

  it('skips registration when already registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(true);

    await registerBackgroundSync();

    expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
  });
});

describe('unregisterBackgroundSync', () => {
  it('unregisters the task when registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(true);

    await unregisterBackgroundSync();

    expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_SYNC_TASK);
  });

  it('skips unregistration when not registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(false);

    await unregisterBackgroundSync();

    expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribeToConnectivity
// ---------------------------------------------------------------------------

describe('subscribeToConnectivity', () => {
  it('subscribes to NetInfo and calls onStatusChange', () => {
    const unsubFn = jest.fn();
    mockNetInfoAddEventListener.mockReturnValue(unsubFn);

    const onStatusChange = jest.fn();
    const unsub = subscribeToConnectivity(onStatusChange);

    expect(mockNetInfoAddEventListener).toHaveBeenCalledTimes(1);

    // Simulate a connectivity event
    const handler = mockNetInfoAddEventListener.mock.calls[0][0];
    handler({ isConnected: false });

    expect(onStatusChange).toHaveBeenCalledWith(false);

    unsub();
    expect(unsubFn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribeToAppState
// ---------------------------------------------------------------------------

describe('subscribeToAppState', () => {
  it('subscribes to AppState changes', () => {
    const mockRemove = jest.fn();
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: mockRemove } as unknown as ReturnType<typeof AppState.addEventListener>);

    const subscription = subscribeToAppState();

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

    subscription.remove();
    expect(mockRemove).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Background task definition
// ---------------------------------------------------------------------------

describe('background task definition', () => {
  it('defines the task callback via TaskManager.defineTask', () => {
    expect(taskStore.callback).toBeInstanceOf(Function);
  });

  it('returns NewData on successful sync', async () => {
    mockGetQueueCount.mockResolvedValue(0);
    mockApiGet.mockResolvedValue({ data: [] });

    const result = await taskStore.callback!();
    // BackgroundFetchResult.NewData = 2
    expect(result).toBe(2);
  });
});
