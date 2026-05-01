import { act, renderHook } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';
import { useKeyboardHeight } from '../useKeyboardHeight';

// Mock the Keyboard API
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => {
  const listeners: { [key: string]: Function[] } = {};
  
  return {
    addListener: jest.fn((event: string, callback: Function) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
      
      return {
        remove: jest.fn(() => {
          const index = listeners[event].indexOf(callback);
          if (index > -1) {
            listeners[event].splice(index, 1);
          }
        }),
      };
    }),
    removeListener: jest.fn(),
    // Helper to trigger events in tests
    _triggerEvent: (event: string, data: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
    _clearListeners: () => {
      Object.keys(listeners).forEach(key => {
        listeners[key] = [];
      });
    },
  };
});

const MockedKeyboard = Keyboard as any;

describe('useKeyboardHeight Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedKeyboard._clearListeners();
  });

  describe('Initial State', () => {
    it('should return initial state with keyboard hidden', () => {
      // Validates: Initial hook state
      const { result } = renderHook(() => useKeyboardHeight());
      
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
    });
  });

  describe('Keyboard Show Events', () => {
    it('should update height when keyboard shows on iOS', () => {
      // Validates: Requirement 9.4 - Keyboard height detection
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Simulate keyboard show event
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.isKeyboardVisible).toBe(true);
    });

    it('should update height when keyboard shows on Android', () => {
      // Validates: Requirement 9.4 - Keyboard height detection
      Platform.OS = 'android';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Simulate keyboard show event
      act(() => {
        MockedKeyboard._triggerEvent('keyboardDidShow', {
          endCoordinates: { height: 280 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(280);
      expect(result.current.isKeyboardVisible).toBe(true);
    });

    it('should handle different keyboard heights', () => {
      // Validates: Dynamic height handling
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Test with different heights
      const heights = [250, 300, 350, 400];
      
      heights.forEach(height => {
        act(() => {
          MockedKeyboard._triggerEvent('keyboardWillShow', {
            endCoordinates: { height },
          });
        });
        
        expect(result.current.keyboardHeight).toBe(height);
        expect(result.current.isKeyboardVisible).toBe(true);
      });
    });
  });

  describe('Keyboard Hide Events', () => {
    it('should reset height when keyboard hides on iOS', () => {
      // Validates: Keyboard hide detection
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Show keyboard first
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.isKeyboardVisible).toBe(true);
      
      // Hide keyboard
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillHide', {});
      });
      
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
    });

    it('should reset height when keyboard hides on Android', () => {
      // Validates: Keyboard hide detection
      Platform.OS = 'android';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Show keyboard first
      act(() => {
        MockedKeyboard._triggerEvent('keyboardDidShow', {
          endCoordinates: { height: 280 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(280);
      expect(result.current.isKeyboardVisible).toBe(true);
      
      // Hide keyboard
      act(() => {
        MockedKeyboard._triggerEvent('keyboardDidHide', {});
      });
      
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
    });
  });

  describe('Event Listener Management', () => {
    it('should register correct event listeners on iOS', () => {
      // Validates: Platform-specific event registration
      Platform.OS = 'ios';
      
      const addListenerSpy = jest.spyOn(Keyboard, 'addListener');
      
      renderHook(() => useKeyboardHeight());
      
      expect(addListenerSpy).toHaveBeenCalledWith(
        'keyboardWillShow',
        expect.any(Function)
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'keyboardWillHide',
        expect.any(Function)
      );
    });

    it('should register correct event listeners on Android', () => {
      // Validates: Platform-specific event registration
      Platform.OS = 'android';
      
      const addListenerSpy = jest.spyOn(Keyboard, 'addListener');
      
      renderHook(() => useKeyboardHeight());
      
      expect(addListenerSpy).toHaveBeenCalledWith(
        'keyboardDidShow',
        expect.any(Function)
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'keyboardDidHide',
        expect.any(Function)
      );
    });

    it('should clean up listeners on unmount', () => {
      // Validates: Proper cleanup
      const removeMock = jest.fn();
      jest.spyOn(Keyboard, 'addListener').mockReturnValue({
        remove: removeMock,
      });
      
      const { unmount } = renderHook(() => useKeyboardHeight());
      
      unmount();
      
      // Should remove both listeners (show and hide)
      expect(removeMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multiple Show/Hide Cycles', () => {
    it('should handle multiple keyboard show/hide cycles', () => {
      // Validates: Repeated keyboard interactions
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Cycle 1
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 },
        });
      });
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.isKeyboardVisible).toBe(true);
      
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillHide', {});
      });
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
      
      // Cycle 2
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 350 },
        });
      });
      expect(result.current.keyboardHeight).toBe(350);
      expect(result.current.isKeyboardVisible).toBe(true);
      
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillHide', {});
      });
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle keyboard show with zero height', () => {
      // Validates: Edge case handling
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 0 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(true);
    });

    it('should handle keyboard show with very large height', () => {
      // Validates: Large height values
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 1000 },
        });
      });
      
      expect(result.current.keyboardHeight).toBe(1000);
      expect(result.current.isKeyboardVisible).toBe(true);
    });

    it('should handle rapid keyboard show/hide events', () => {
      // Validates: Rapid event handling
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 },
        });
        MockedKeyboard._triggerEvent('keyboardWillHide', {});
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 320 },
        });
      });
      
      // Should reflect the last event
      expect(result.current.keyboardHeight).toBe(320);
      expect(result.current.isKeyboardVisible).toBe(true);
    });
  });

  describe('Requirement Validation', () => {
    it('should validate Requirement 9.4: Keyboard Height Detection', () => {
      // Validates: Requirement 9.4 - Detect keyboard height
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => useKeyboardHeight());
      
      // Initial state
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
      
      // Keyboard appears
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillShow', {
          endCoordinates: { height: 300 },
        });
      });
      
      // Should detect keyboard and its height
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.isKeyboardVisible).toBe(true);
      
      // Keyboard disappears
      act(() => {
        MockedKeyboard._triggerEvent('keyboardWillHide', {});
      });
      
      // Should detect keyboard dismissal
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.isKeyboardVisible).toBe(false);
    });
  });
});
