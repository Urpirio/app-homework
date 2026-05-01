import { act, renderHook } from '@testing-library/react-native';
import { useAnimatedTransition } from '../useAnimatedTransition';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('useAnimatedTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with isTransitioning as false', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login'));
    
    expect(result.current.isTransitioning).toBe(false);
  });

  it('should provide startTransition function', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login'));
    
    expect(typeof result.current.startTransition).toBe('function');
  });

  it('should call router.replace with target route when startTransition is called', () => {
    const targetRoute = '/login';
    const { result } = renderHook(() => useAnimatedTransition(targetRoute));
    
    act(() => {
      result.current.startTransition();
    });

    // Fast-forward timers to execute the transition
    act(() => {
      jest.runAllTimers();
    });

    expect(mockReplace).toHaveBeenCalledWith(targetRoute);
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('should set isTransitioning to true when startTransition is called', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login'));
    
    act(() => {
      result.current.startTransition();
    });

    expect(result.current.isTransitioning).toBe(true);
  });

  it('should respect delay parameter before calling router.replace', () => {
    const delay = 500;
    const { result } = renderHook(() => useAnimatedTransition('/login', delay));
    
    act(() => {
      result.current.startTransition();
    });

    // Should not have called replace yet
    expect(mockReplace).not.toHaveBeenCalled();

    // Advance timers by less than delay
    act(() => {
      jest.advanceTimersByTime(delay - 100);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    // Advance timers to complete delay
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('should prevent multiple simultaneous transitions', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login'));
    
    act(() => {
      result.current.startTransition();
      result.current.startTransition();
      result.current.startTransition();
    });

    act(() => {
      jest.runAllTimers();
    });

    // Should only call replace once despite multiple calls
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('should use router.replace instead of router.push to remove splash from stack', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login'));
    
    act(() => {
      result.current.startTransition();
    });

    act(() => {
      jest.runAllTimers();
    });

    // Verify that replace was called (not push)
    expect(mockReplace).toHaveBeenCalled();
  });

  it('should work with different target routes', () => {
    const routes = ['/login', '/home', '/dashboard', '/(auth)/login'];
    
    routes.forEach((route) => {
      mockReplace.mockClear();
      const { result } = renderHook(() => useAnimatedTransition(route));
      
      act(() => {
        result.current.startTransition();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith(route);
    });
  });

  it('should handle zero delay correctly', () => {
    const { result } = renderHook(() => useAnimatedTransition('/login', 0));
    
    act(() => {
      result.current.startTransition();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
