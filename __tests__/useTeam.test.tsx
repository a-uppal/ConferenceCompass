/**
 * useTeam Hook Tests
 *
 * Tests the team management hook functionality with mocked Supabase
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock data - defined before mocks
const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
};

const mockTeam = {
  id: 'team-123',
  name: 'Test Team',
  description: 'A test team',
  created_by: mockUser.id,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockConference = {
  id: 'conf-123',
  team_id: mockTeam.id,
  name: 'Test Conference 2026',
  location: 'San Francisco',
  start_date: '2026-03-01',
  end_date: '2026-03-03',
  description: 'Annual test conference',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// Mock Supabase - define inline to ensure proper module hoisting
jest.mock('../services/supabase', () => {
  const mockAuth = {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn((callback: any) => ({
      data: {
        subscription: { unsubscribe: jest.fn() },
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
const mockSupabaseAuth = supabase.auth as any;
const mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

// Import after mocks
import { TeamProvider, useTeam } from '../hooks/useTeam';
import { AuthProvider } from '../hooks/useAuth';

// Wrapper with both Auth and Team providers
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <TeamProvider>{children}</TeamProvider>
    </AuthProvider>
  );
};

describe('useTeam Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for users table (for ensureUserProfile)
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        };
      }
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      };
    });
  });

  describe('Initial State - Unauthenticated', () => {
    beforeEach(() => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
    });

    it('should have empty teams when not authenticated', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTeam(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.activeTeam).toBeNull();
      expect(result.current.activeConference).toBeNull();
    });
  });

  describe('Initial State - Authenticated with no teams', () => {
    beforeEach(() => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: { id: mockUser.id }, error: null })),
            insert: jest.fn(() => Promise.resolve({ error: null })),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });
    });

    it('should have empty teams when user has no memberships', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTeam(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.activeTeam).toBeNull();
    });
  });

  describe('createTeam', () => {
    it('should throw error when not authenticated', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTeam(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.createTeam('Test', 'Desc')
      ).rejects.toThrow('Must be authenticated to create a team');
    });
  });

  describe('setActiveConference', () => {
    it('should update active conference', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: { id: mockUser.id }, error: null })),
            insert: jest.fn(() => Promise.resolve({ error: null })),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTeam(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setActiveConference(mockConference);
      });

      expect(result.current.activeConference).toEqual(mockConference);
    });
  });

  describe('Error Handling', () => {
    it('should handle team_members query error gracefully', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: { id: mockUser.id }, error: null })),
            insert: jest.fn(() => Promise.resolve({ error: null })),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn(() => Promise.resolve({
              data: null,
              error: new Error('Database error'),
            })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTeam(), { wrapper });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.teams).toEqual([]);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
