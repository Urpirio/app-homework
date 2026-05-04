import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { withRetry } from './retry';

const QUEUE_KEY = 'offline_queue';

/**
 * Represents a queued API action to be executed when connectivity is restored.
 */
export interface QueuedAction {
  id: string;
  type: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  data?: unknown;
  createdAt: string;
  retryCount: number;
}

/**
 * Reads the current offline queue from AsyncStorage.
 */
export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

/**
 * Persists the queue array to AsyncStorage.
 */
async function saveQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Returns the number of pending actions in the queue.
 */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Adds a new action to the end of the offline queue (FIFO).
 */
export async function enqueue(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>
): Promise<QueuedAction> {
  const queue = await getQueue();
  const queued: QueuedAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(queued);
  await saveQueue(queue);
  return queued;
}

/**
 * Processes the offline queue in FIFO order.
 *
 * - Successful actions are removed from the queue.
 * - Failed actions stay in the queue with an incremented retryCount.
 * - Processing stops on the first failure to preserve ordering.
 *
 * @returns The number of actions successfully processed.
 */
export async function processQueue(): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  let processed = 0;

  for (const action of queue) {
    try {
      await withRetry(
        () =>
          api.request({
            method: action.type,
            url: action.url,
            data: action.data,
          }),
        { maxAttempts: 1 } // single attempt per cycle; retries happen across cycles
      );
      processed++;
    } catch {
      // Increment retry count on the failed action and stop processing
      // to preserve FIFO order.
      action.retryCount += 1;
      break;
    }
  }

  // Remove successfully processed actions from the front of the queue
  const remaining = queue.slice(processed);
  await saveQueue(remaining);
  return processed;
}

/**
 * Clears the entire offline queue.
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
