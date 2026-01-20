/**
 * useAuth Hook Tests
 *
 * Tests the authentication hook functionality with mocked Supabase
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock user data
const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
};

// Store the auth state change callback
let authStateChangeCallback: ((event: string, session: any) => void) | null = null;

// Mock Supabase auth - define inline to ensure proper module hoisting
jest.mock('../services/supabase', () => {
  const mockAuth = {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn((callback: any) => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        },
      },
    })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithOAuth: jest.fn(),
  };

  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => Promise.resolve({ error: null })),
  }));

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

// Import the mocked module to get references
import { supabase } from '../services/supabase';
const mockSupabaseAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

// Import after mocks
import { AuthProvider, useAuth } from '../hooks/useAuth';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeCallback = null;

    // Default: no session
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  describe('Initial State', () => {
    it('should have no user when not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Run pending timers and effects
      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should have user when session exists on mount', async () => {
      // Use real timers for this test since we need the async init to complete
      // before the 5-second timeout
      jest.useRealTimers();

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the async session initialization to complete and set the user
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      }, { timeout: 3000 });

      expect(result.current.isAuthenticated).toBe(true);

      // Restore fake timers for other tests
      jest.useFakeTimers();
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on failed sign in', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await expect(
        result.current.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with user metadata', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123', 'New User');
      });

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
          },
        },
      });
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('OAuth methods', () => {
    it('should call signInWithOAuth for Google', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
      });
    });

    it('should call signInWithOAuth for LinkedIn', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await act(async () => {
        await result.current.signInWithLinkedIn();
      });

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'linkedin_oidc',
      });
    });
  });
});
