/**
 * ConferenceSelector Component Tests
 *
 * Tests the conference selector UI component
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

// Mock data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
};

const mockTeam = {
  id: 'team-123',
  name: 'Data Compass Team',
  description: 'Sales team',
  created_by: mockUser.id,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockConference = {
  id: 'conf-123',
  team_id: mockTeam.id,
  name: 'Leaders of the Future 2026',
  location: 'Frankfurt, Germany',
  start_date: '2026-03-10',
  end_date: '2026-03-12',
  description: 'Annual leadership conference',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// Mock useAuth
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Create mutable mock state
let mockTeamState = {
  teams: [] as any[],
  conferences: [] as any[],
  activeTeam: null as any,
  activeConference: null as any,
  isLoading: false,
  setActiveConference: jest.fn(),
  createTeam: jest.fn(),
  refreshTeams: jest.fn(),
};

jest.mock('../hooks/useTeam', () => ({
  useTeam: () => mockTeamState,
}));

// Mock expo-router - define push function inline for proper hoisting
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => {
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    },
  };
});

// Get reference to the mocked module
import { router } from 'expo-router';
const mockRouter = router as { push: jest.MockedFunction<typeof router.push> };

// Mock Supabase
const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
}));

jest.mock('../services/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockSupabaseFrom(...args),
  },
}));

// Import component after mocks
import { ConferenceSelector } from '../components/ConferenceSelector';

// Wrapper with PaperProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('ConferenceSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockRouter.push as jest.Mock).mockClear();

    // Reset mock state
    mockTeamState = {
      teams: [],
      conferences: [],
      activeTeam: null,
      activeConference: null,
      isLoading: false,
      setActiveConference: jest.fn(),
      createTeam: jest.fn().mockResolvedValue(mockTeam),
      refreshTeams: jest.fn().mockResolvedValue(undefined),
    };

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', async () => {
      mockTeamState.isLoading = true;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('Loading your conferences...')).toBeTruthy();
    });
  });

  describe('No Teams State', () => {
    it('should show welcome message when user has no teams', async () => {
      mockTeamState.teams = [];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('Welcome to Conference Compass')).toBeTruthy();
    });

    it('should show user ID for debugging', async () => {
      mockTeamState.teams = [];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText(/Your User ID: test-use.../)).toBeTruthy();
    });

    it('should show Create Team section', async () => {
      mockTeamState.teams = [];
      mockTeamState.isLoading = false;

      const { getByText, getByPlaceholderText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('Create a new team to get started')).toBeTruthy();
      expect(getByPlaceholderText('e.g., Data Compass Sales Team')).toBeTruthy();
    });

    it('should call createTeam when Create Team button is pressed with valid name', async () => {
      mockTeamState.teams = [];
      mockTeamState.isLoading = false;

      const { getByPlaceholderText, getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      const input = getByPlaceholderText('e.g., Data Compass Sales Team');
      fireEvent.changeText(input, 'My New Team');

      const createButton = getByText('Create Team');

      await act(async () => {
        fireEvent.press(createButton);
        jest.runAllTimers();
      });

      expect(mockTeamState.createTeam).toHaveBeenCalledWith('My New Team', 'My conference team');
    });
  });

  describe('Team Exists but No Conferences', () => {
    it('should show "No Conferences Yet" message', async () => {
      mockTeamState.teams = [mockTeam];
      mockTeamState.activeTeam = mockTeam;
      mockTeamState.conferences = [];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('No Conferences Yet')).toBeTruthy();
      expect(getByText(/Your team "Data Compass Team" doesn't have any conferences/)).toBeTruthy();
    });
  });

  describe('Conferences Available', () => {
    it('should show conference list', async () => {
      mockTeamState.teams = [mockTeam];
      mockTeamState.activeTeam = mockTeam;
      mockTeamState.conferences = [mockConference];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('Select a Conference')).toBeTruthy();
      expect(getByText('Leaders of the Future 2026')).toBeTruthy();
      expect(getByText('Frankfurt, Germany')).toBeTruthy();
    });

    it('should call setActiveConference when conference is selected', async () => {
      mockTeamState.teams = [mockTeam];
      mockTeamState.activeTeam = mockTeam;
      mockTeamState.conferences = [mockConference];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      fireEvent.press(getByText('Leaders of the Future 2026'));

      expect(mockTeamState.setActiveConference).toHaveBeenCalledWith(mockConference);
    });

    it('should display multiple conferences', async () => {
      const secondConference = {
        ...mockConference,
        id: 'conf-456',
        name: 'Second Conference',
        location: 'Berlin',
      };

      mockTeamState.teams = [mockTeam];
      mockTeamState.activeTeam = mockTeam;
      mockTeamState.conferences = [mockConference, secondConference];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(getByText('Leaders of the Future 2026')).toBeTruthy();
      expect(getByText('Second Conference')).toBeTruthy();
    });
  });

  describe('Debug Button', () => {
    it('should navigate to debug screen when debug button is pressed', async () => {
      mockTeamState.teams = [];
      mockTeamState.isLoading = false;

      const { getByText } = renderWithProvider(<ConferenceSelector />);

      await act(async () => {
        jest.runAllTimers();
      });

      fireEvent.press(getByText('Open Debug Screen'));

      expect(mockRouter.push).toHaveBeenCalledWith('/debug');
    });
  });
});
