import { useContactStore } from '../stores/contactStore';

// Mock Supabase
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: mockContacts, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockNewContact, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
      })),
    },
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })),
    },
  },
}));

const mockContacts = [
  {
    id: 'contact-1',
    conference_id: 'conf-1',
    captured_by: 'test-user-id',
    first_name: 'John',
    last_name: 'Doe',
    company: 'Acme Inc',
    title: 'CEO',
    email: 'john@acme.com',
    follow_up_status: 'pending' as const,
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'contact-2',
    conference_id: 'conf-1',
    captured_by: 'test-user-id',
    first_name: 'Jane',
    last_name: 'Smith',
    company: 'Pharma Corp',
    title: 'CTO',
    email: 'jane@pharma.com',
    follow_up_status: 'none' as const,
    created_at: '2026-03-10T11:00:00Z',
    updated_at: '2026-03-10T11:00:00Z',
  },
];

const mockNewContact = {
  id: 'contact-3',
  conference_id: 'conf-1',
  captured_by: 'test-user-id',
  first_name: 'New',
  last_name: 'Contact',
  company: 'New Company',
  title: 'Manager',
  email: 'new@company.com',
  follow_up_status: 'none' as const,
  created_at: '2026-03-10T12:00:00Z',
  updated_at: '2026-03-10T12:00:00Z',
};

describe('ContactStore', () => {
  beforeEach(() => {
    useContactStore.setState({
      contacts: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        followUpStatus: 'all',
        capturedBy: null,
        dateRange: 'all',
      },
    });
  });

  describe('Initial State', () => {
    it('should have empty contacts array initially', () => {
      const state = useContactStore.getState();
      expect(state.contacts).toEqual([]);
    });

    it('should have isLoading false initially', () => {
      const state = useContactStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have default filters', () => {
      const state = useContactStore.getState();
      expect(state.filters.followUpStatus).toBe('all');
      expect(state.filters.search).toBe('');
      expect(state.filters.dateRange).toBe('all');
    });
  });

  describe('setFilters', () => {
    it('should update search filter', () => {
      const { setFilters } = useContactStore.getState();
      setFilters({ search: 'john' });

      const state = useContactStore.getState();
      expect(state.filters.search).toBe('john');
    });

    it('should update follow-up status filter', () => {
      const { setFilters } = useContactStore.getState();
      setFilters({ followUpStatus: 'pending' });

      const state = useContactStore.getState();
      expect(state.filters.followUpStatus).toBe('pending');
    });

    it('should update date range filter', () => {
      const { setFilters } = useContactStore.getState();
      setFilters({ dateRange: 'today' });

      const state = useContactStore.getState();
      expect(state.filters.dateRange).toBe('today');
    });
  });

  describe('getFilteredContacts', () => {
    beforeEach(() => {
      useContactStore.setState({ contacts: mockContacts });
    });

    it('should return all contacts with default filters', () => {
      const state = useContactStore.getState();
      const filtered = state.getFilteredContacts();

      expect(filtered.length).toBe(2);
    });

    it('should filter by search term (first name)', () => {
      useContactStore.setState({
        contacts: mockContacts,
        filters: { ...useContactStore.getState().filters, search: 'john' }
      });

      const state = useContactStore.getState();
      const filtered = state.getFilteredContacts();

      expect(filtered.length).toBe(1);
      expect(filtered[0].first_name).toBe('John');
    });

    it('should filter by search term (company)', () => {
      useContactStore.setState({
        contacts: mockContacts,
        filters: { ...useContactStore.getState().filters, search: 'pharma' }
      });

      const state = useContactStore.getState();
      const filtered = state.getFilteredContacts();

      expect(filtered.length).toBe(1);
      expect(filtered[0].company).toBe('Pharma Corp');
    });

    it('should filter by follow-up status', () => {
      useContactStore.setState({
        contacts: mockContacts,
        filters: { ...useContactStore.getState().filters, followUpStatus: 'pending' }
      });

      const state = useContactStore.getState();
      const filtered = state.getFilteredContacts();

      expect(filtered.length).toBe(1);
      expect(filtered[0].follow_up_status).toBe('pending');
    });
  });

  describe('Contact Statistics (computed from state)', () => {
    it('should have correct contact count', () => {
      useContactStore.setState({ contacts: mockContacts });

      const state = useContactStore.getState();
      expect(state.contacts.length).toBe(2);
    });

    it('should be able to count pending follow-ups', () => {
      useContactStore.setState({ contacts: mockContacts });

      const state = useContactStore.getState();
      const pendingCount = state.contacts.filter(c => c.follow_up_status === 'pending').length;
      expect(pendingCount).toBe(1);
    });

    it('should have zero contacts initially', () => {
      const state = useContactStore.getState();
      expect(state.contacts.length).toBe(0);
    });
  });
});
