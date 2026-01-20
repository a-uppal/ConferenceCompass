import { useSessionStore } from '../stores/sessionStore';

// Mock Supabase
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: mockSessions, error: null })),
        })),
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })),
    },
  },
}));

const mockSessions = [
  {
    id: 'session-1',
    conference_id: 'conf-1',
    title: 'Opening Keynote',
    description: 'Welcome session',
    speaker_name: 'John Doe',
    speaker_company: 'Acme Inc',
    start_time: '2026-03-10T08:40:00-05:00',
    end_time: '2026-03-10T09:00:00-05:00',
    location: 'Main Hall',
    track: 'Keynote',
    talking_points: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'session-2',
    conference_id: 'conf-1',
    title: 'AI in Drug Discovery',
    description: 'Panel discussion',
    speaker_name: 'Jane Smith',
    speaker_company: 'Pharma Corp',
    start_time: '2026-03-10T09:00:00-05:00',
    end_time: '2026-03-10T10:00:00-05:00',
    location: 'Room A',
    track: 'AI',
    talking_points: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

describe('SessionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSessionStore.setState({
      sessions: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        date: null,
        track: null,
        attendanceStatus: 'all',
      },
      selectedDate: new Date('2026-03-10'),
    });
  });

  describe('Initial State', () => {
    it('should have empty sessions array initially', () => {
      const state = useSessionStore.getState();
      expect(state.sessions).toEqual([]);
    });

    it('should have isLoading false initially', () => {
      const state = useSessionStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have default filters', () => {
      const state = useSessionStore.getState();
      expect(state.filters.attendanceStatus).toBe('all');
      expect(state.filters.search).toBe('');
      expect(state.filters.track).toBeNull();
    });
  });

  describe('setFilters', () => {
    it('should update search filter', () => {
      const { setFilters } = useSessionStore.getState();
      setFilters({ search: 'keynote' });

      const state = useSessionStore.getState();
      expect(state.filters.search).toBe('keynote');
    });

    it('should update track filter', () => {
      const { setFilters } = useSessionStore.getState();
      setFilters({ track: 'AI' });

      const state = useSessionStore.getState();
      expect(state.filters.track).toBe('AI');
    });

    it('should update attendance filter', () => {
      const { setFilters } = useSessionStore.getState();
      setFilters({ attendanceStatus: 'planned' });

      const state = useSessionStore.getState();
      expect(state.filters.attendanceStatus).toBe('planned');
    });

    it('should preserve other filters when updating one', () => {
      const { setFilters } = useSessionStore.getState();
      setFilters({ search: 'test' });
      setFilters({ track: 'AI' });

      const state = useSessionStore.getState();
      expect(state.filters.search).toBe('test');
      expect(state.filters.track).toBe('AI');
    });
  });

  describe('setSelectedDate', () => {
    it('should update selected date', () => {
      const { setSelectedDate } = useSessionStore.getState();
      const newDate = new Date('2026-03-11');
      setSelectedDate(newDate);

      const state = useSessionStore.getState();
      expect(state.selectedDate).toEqual(newDate);
    });
  });

  describe('getSessionsByDate', () => {
    beforeEach(() => {
      useSessionStore.setState({ sessions: mockSessions });
    });

    it('should filter sessions by date', () => {
      const state = useSessionStore.getState();
      const sessionsOnMarch10 = state.getSessionsByDate(new Date('2026-03-10'));

      expect(sessionsOnMarch10.length).toBe(2);
    });

    it('should return empty array for date with no sessions', () => {
      const state = useSessionStore.getState();
      const sessionsOnMarch11 = state.getSessionsByDate(new Date('2026-03-11'));

      expect(sessionsOnMarch11.length).toBe(0);
    });

    it('should apply search filter', () => {
      useSessionStore.setState({
        sessions: mockSessions,
        filters: { ...useSessionStore.getState().filters, search: 'keynote' }
      });

      const state = useSessionStore.getState();
      const filtered = state.getSessionsByDate(new Date('2026-03-10'));

      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Opening Keynote');
    });

    it('should apply track filter', () => {
      useSessionStore.setState({
        sessions: mockSessions,
        filters: { ...useSessionStore.getState().filters, track: 'AI' }
      });

      const state = useSessionStore.getState();
      const filtered = state.getSessionsByDate(new Date('2026-03-10'));

      expect(filtered.length).toBe(1);
      expect(filtered[0].track).toBe('AI');
    });
  });

  describe('getTracks', () => {
    it('should return unique tracks from sessions', () => {
      useSessionStore.setState({ sessions: mockSessions });

      const state = useSessionStore.getState();
      const tracks = state.getTracks();

      expect(tracks).toContain('Keynote');
      expect(tracks).toContain('AI');
      expect(tracks.length).toBe(2);
    });

    it('should return sorted tracks', () => {
      useSessionStore.setState({ sessions: mockSessions });

      const state = useSessionStore.getState();
      const tracks = state.getTracks();

      expect(tracks).toEqual(['AI', 'Keynote']);
    });

    it('should return empty array when no sessions', () => {
      const state = useSessionStore.getState();
      const tracks = state.getTracks();

      expect(tracks).toEqual([]);
    });
  });
});
