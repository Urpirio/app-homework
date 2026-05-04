import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    clearQueue,
    enqueue,
    getQueue,
    getQueueCount,
    processQueue,
    QueuedAction,
} from '../offlineQueue';

// --- Mocks ---

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockRequest = jest.fn();
jest.mock('../api', () => ({
  __esModule: true,
  default: { request: (...args: unknown[]) => mockRequest(...args) },
}));

jest.mock('../retry', () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;
const mockedRemoveItem = AsyncStorage.removeItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getQueue
// ---------------------------------------------------------------------------

describe('getQueue', () => {
  it('returns an empty array when storage is empty', async () => {
    mockedGetItem.mockResolvedValue(null);
    expect(await getQueue()).toEqual([]);
  });

  it('parses stored JSON', async () => {
    const items: QueuedAction[] = [
      {
        id: '1',
        type: 'POST',
        url: '/tasks',
        data: { title: 'hw' },
        createdAt: '2025-01-01T00:00:00.000Z',
        retryCount: 0,
      },
    ];
    mockedGetItem.mockResolvedValue(JSON.stringify(items));
    expect(await getQueue()).toEqual(items);
  });

  it('returns empty array on corrupt JSON', async () => {
    mockedGetItem.mockResolvedValue('not-json');
    expect(await getQueue()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

describe('enqueue', () => {
  it('appends an action with generated id, createdAt, and retryCount 0', async () => {
    mockedGetItem.mockResolvedValue(null);

    const result = await enqueue({ type: 'POST', url: '/submissions', data: { taskId: '1' } });

    expect(result.id).toBeDefined();
    expect(result.retryCount).toBe(0);
    expect(result.createdAt).toBeDefined();
    expect(result.type).toBe('POST');
    expect(result.url).toBe('/submissions');

    expect(mockedSetItem).toHaveBeenCalledWith(
      'offline_queue',
      expect.stringContaining('"url":"/submissions"')
    );
  });

  it('preserves existing items in the queue', async () => {
    const existing: QueuedAction[] = [
      { id: 'a', type: 'PUT', url: '/x', createdAt: '', retryCount: 0 },
    ];
    mockedGetItem.mockResolvedValue(JSON.stringify(existing));

    await enqueue({ type: 'DELETE', url: '/y' });

    const saved = JSON.parse(mockedSetItem.mock.calls[0][1]) as QueuedAction[];
    expect(saved).toHaveLength(2);
    expect(saved[0].id).toBe('a');
    expect(saved[1].url).toBe('/y');
  });
});

// ---------------------------------------------------------------------------
// getQueueCount
// ---------------------------------------------------------------------------

describe('getQueueCount', () => {
  it('returns 0 for empty queue', async () => {
    mockedGetItem.mockResolvedValue(null);
    expect(await getQueueCount()).toBe(0);
  });

  it('returns the number of queued items', async () => {
    const items: QueuedAction[] = [
      { id: '1', type: 'POST', url: '/a', createdAt: '', retryCount: 0 },
      { id: '2', type: 'PATCH', url: '/b', createdAt: '', retryCount: 0 },
    ];
    mockedGetItem.mockResolvedValue(JSON.stringify(items));
    expect(await getQueueCount()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// processQueue
// ---------------------------------------------------------------------------

describe('processQueue', () => {
  it('returns 0 when queue is empty', async () => {
    mockedGetItem.mockResolvedValue(null);
    expect(await processQueue()).toBe(0);
  });

  it('processes all actions in FIFO order and clears the queue', async () => {
    const items: QueuedAction[] = [
      { id: '1', type: 'POST', url: '/a', data: { x: 1 }, createdAt: '', retryCount: 0 },
      { id: '2', type: 'PATCH', url: '/b', data: { y: 2 }, createdAt: '', retryCount: 0 },
    ];
    mockedGetItem.mockResolvedValue(JSON.stringify(items));
    mockRequest.mockResolvedValue({ data: 'ok' });

    const processed = await processQueue();

    expect(processed).toBe(2);
    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(mockRequest).toHaveBeenNthCalledWith(1, { method: 'POST', url: '/a', data: { x: 1 } });
    expect(mockRequest).toHaveBeenNthCalledWith(2, { method: 'PATCH', url: '/b', data: { y: 2 } });

    // Queue should be empty after processing
    const saved = JSON.parse(mockedSetItem.mock.calls[0][1]) as QueuedAction[];
    expect(saved).toEqual([]);
  });

  it('stops on first failure and increments retryCount', async () => {
    const items: QueuedAction[] = [
      { id: '1', type: 'POST', url: '/a', createdAt: '', retryCount: 0 },
      { id: '2', type: 'POST', url: '/b', createdAt: '', retryCount: 0 },
      { id: '3', type: 'POST', url: '/c', createdAt: '', retryCount: 0 },
    ];
    mockedGetItem.mockResolvedValue(JSON.stringify(items));

    // First succeeds, second fails
    mockRequest
      .mockResolvedValueOnce({ data: 'ok' })
      .mockRejectedValueOnce(new Error('network'));

    const processed = await processQueue();

    expect(processed).toBe(1);
    expect(mockRequest).toHaveBeenCalledTimes(2);

    // Remaining queue should have items 2 and 3, with item 2's retryCount incremented
    const saved = JSON.parse(mockedSetItem.mock.calls[0][1]) as QueuedAction[];
    expect(saved).toHaveLength(2);
    expect(saved[0].id).toBe('2');
    expect(saved[0].retryCount).toBe(1);
    expect(saved[1].id).toBe('3');
    expect(saved[1].retryCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// clearQueue
// ---------------------------------------------------------------------------

describe('clearQueue', () => {
  it('removes the queue key from AsyncStorage', async () => {
    await clearQueue();
    expect(mockedRemoveItem).toHaveBeenCalledWith('offline_queue');
  });
});
