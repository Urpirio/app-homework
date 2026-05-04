import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState, Text } from 'react-native';
import { SessionTimeoutProvider } from '../SessionTimeoutProvider';

// Mock expo-secure-store
const mockDeleteItemAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

// Mock queryClient
const mockClear = jest.fn();
jest.mock('@/utils/queryClient', () => ({
  queryClient: {
    clear: () => mockClear(),
  },
}));

describe('SessionTimeoutProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Reset Date.now to a known value
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders children', () => {
    const { getByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    expect(getByText('Test Child')).toBeTruthy();
  });

  it('does not show warning modal initially', () => {
    const { queryByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    expect(queryByText('Session Expiring')).toBeNull();
  });

  it('shows warning modal after 25 minutes of inactivity', () => {
    const { getByText, queryByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Initially no warning
    expect(queryByText('Session Expiring')).toBeNull();

    // Advance time by 25 minutes + 1 second
    const twentyFiveMinutes = 25 * 60 * 1000 + 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + twentyFiveMinutes);

    // Trigger the interval check (60 seconds)
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(getByText('Session Expiring')).toBeTruthy();
    expect(
      getByText(/Your session will expire in 5 minutes/)
    ).toBeTruthy();
  });

  it('resets timer when Continue button is pressed', () => {
    const { getByText, queryByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Advance to 25 min inactivity
    const twentyFiveMinutes = 25 * 60 * 1000 + 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + twentyFiveMinutes);

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(getByText('Session Expiring')).toBeTruthy();

    // Reset Date.now to simulate "now" when Continue is pressed
    (Date.now as jest.Mock).mockReturnValue(1000000 + twentyFiveMinutes);

    // Press Continue
    fireEvent.press(getByText('Continue'));

    // Warning should be dismissed
    expect(queryByText('Session Expiring')).toBeNull();
  });

  it('triggers automatic logout after 30 minutes of inactivity', async () => {
    render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Advance time by 30 minutes + 1 second
    const thirtyMinutes = 30 * 60 * 1000 + 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + thirtyMinutes);

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    // Should clear SecureStore tokens
    await waitFor(() => {
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('userToken');
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('refreshToken');
    });

    // Should clear React Query cache
    expect(mockClear).toHaveBeenCalled();

    // Should navigate to login
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('resets interaction timestamp on touch events', () => {
    const { getByText, queryByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Advance time by 24 minutes
    const twentyFourMinutes = 24 * 60 * 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + twentyFourMinutes);

    // Simulate a touch — this resets lastInteraction to Date.now()
    fireEvent(getByText('Test Child'), 'touchStart');

    // Now advance another 2 minutes (total 26 from start, but only 2 from last touch)
    const twoMoreMinutes = 2 * 60 * 1000;
    (Date.now as jest.Mock).mockReturnValue(
      1000000 + twentyFourMinutes + twoMoreMinutes
    );

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should NOT show warning because only 2 min since last interaction
    expect(queryByText('Session Expiring')).toBeNull();
  });

  it('pauses timer when app goes to background', () => {
    // Capture the AppState listener
    let appStateCallback: ((state: string) => void) | null = null;
    const mockAddEventListener = jest.spyOn(AppState, 'addEventListener');
    mockAddEventListener.mockImplementation((_type, callback) => {
      appStateCallback = callback as (state: string) => void;
      return { remove: jest.fn() } as any;
    });

    render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Simulate going to background
    act(() => {
      appStateCallback?.('background');
    });

    // Advance time by 30+ minutes while in background
    const thirtyMinutes = 30 * 60 * 1000 + 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + thirtyMinutes);

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should NOT have triggered logout because timer was paused
    expect(mockDeleteItemAsync).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    mockAddEventListener.mockRestore();
  });

  it('resumes and resets timer when app returns to foreground', () => {
    let appStateCallback: ((state: string) => void) | null = null;
    const originalCurrentState = AppState.currentState;

    const mockAddEventListener = jest.spyOn(AppState, 'addEventListener');
    mockAddEventListener.mockImplementation((_type, callback) => {
      appStateCallback = callback as (state: string) => void;
      return { remove: jest.fn() } as any;
    });

    const { queryByText } = render(
      <SessionTimeoutProvider>
        <Text>Test Child</Text>
      </SessionTimeoutProvider>
    );

    // Go to background
    act(() => {
      appStateCallback?.('background');
    });

    // Advance time significantly
    const twentyMinutes = 20 * 60 * 1000;
    (Date.now as jest.Mock).mockReturnValue(1000000 + twentyMinutes);

    // Come back to foreground — this resets lastInteraction
    act(() => {
      appStateCallback?.('active');
    });

    // Advance 2 more minutes from foreground resume
    const twoMinutes = 2 * 60 * 1000;
    (Date.now as jest.Mock).mockReturnValue(
      1000000 + twentyMinutes + twoMinutes
    );

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should NOT show warning (only 2 min since resume)
    expect(queryByText('Session Expiring')).toBeNull();

    mockAddEventListener.mockRestore();
  });
});
