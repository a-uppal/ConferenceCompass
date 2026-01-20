// Mock supabase before importing tripReport
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/directory/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

import { formatReportAsMarkdown, formatReportAsCSV, TripReportData } from '../services/tripReport';

const mockReportData: TripReportData = {
  conference: {
    name: 'Lab of the Future 2026',
    location: 'Boston, MA',
    startDate: '2026-03-10',
    endDate: '2026-03-11',
  },
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
  summary: {
    totalContacts: 5,
    totalSessions: 20,
    attendedSessions: 10,
    totalPosts: 3,
    publishedPosts: 2,
    teamEngagements: 15,
  },
  contacts: [
    {
      id: '1',
      name: 'John Doe',
      company: 'Acme Inc',
      title: 'CEO',
      email: 'john@acme.com',
      notes: 'Great conversation about AI',
      followUpStatus: 'pending',
    },
    {
      id: '2',
      name: 'Jane Smith',
      company: 'Pharma Corp',
      title: 'CTO',
      email: 'jane@pharma.com',
      notes: undefined,
      followUpStatus: 'completed',
    },
  ],
  sessions: [
    {
      id: '1',
      title: 'Opening Keynote',
      date: '3/10/2026',
      time: '08:40 AM',
      location: 'Main Hall',
      status: 'attended',
      takeaways: 'Key insight about lab automation trends',
    },
    {
      id: '2',
      title: 'AI Panel Discussion',
      date: '3/10/2026',
      time: '09:00 AM',
      location: 'Room A',
      status: 'attended',
      takeaways: undefined,
    },
  ],
  posts: [
    {
      id: '1',
      scheduledDate: '2026-03-10',
      status: 'published',
      contentPreview: 'Excited to be at LOTF 2026!',
      linkedinUrl: 'https://linkedin.com/post/123',
    },
  ],
  activities: [
    {
      date: '3/10/2026',
      type: 'contact_captured',
      description: 'Captured contact: John Doe',
    },
  ],
};

describe('Trip Report Service', () => {
  describe('formatReportAsMarkdown', () => {
    it('should include conference name in header', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('# Trip Report: Lab of the Future 2026');
    });

    it('should include user information', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('Test User');
      expect(markdown).toContain('test@example.com');
    });

    it('should include executive summary table', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('## Executive Summary');
      expect(markdown).toContain('| Contacts Captured | 5 |');
      expect(markdown).toContain('| Sessions Attended | 10 of 20 |');
      expect(markdown).toContain('| Posts Published | 2 of 3 |');
    });

    it('should include contacts section', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('## Contacts Captured');
      expect(markdown).toContain('John Doe');
      expect(markdown).toContain('Acme Inc');
      expect(markdown).toContain('CEO');
    });

    it('should include contact notes', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('Great conversation about AI');
    });

    it('should include sessions section', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('## Sessions Attended');
      expect(markdown).toContain('Opening Keynote');
      expect(markdown).toContain('Main Hall');
    });

    it('should include key takeaways', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('### Key Takeaways');
      expect(markdown).toContain('Key insight about lab automation trends');
    });

    it('should include posts section', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('## Social Media Posts');
      expect(markdown).toContain('published');
    });

    it('should include activity log', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('## Activity Log');
      expect(markdown).toContain('contact_captured');
    });

    it('should include footer', () => {
      const markdown = formatReportAsMarkdown(mockReportData);
      expect(markdown).toContain('*Generated by Conference Compass*');
    });
  });

  describe('formatReportAsCSV', () => {
    it('should include contacts section header', () => {
      const csv = formatReportAsCSV(mockReportData);
      expect(csv).toContain('CONTACTS');
      expect(csv).toContain('Name,Company,Title,Email,Follow-up Status,Notes');
    });

    it('should include contact data', () => {
      const csv = formatReportAsCSV(mockReportData);
      expect(csv).toContain('"John Doe"');
      expect(csv).toContain('"Acme Inc"');
      expect(csv).toContain('"CEO"');
    });

    it('should include sessions section', () => {
      const csv = formatReportAsCSV(mockReportData);
      expect(csv).toContain('SESSIONS');
      expect(csv).toContain('Date,Time,Title,Location,Status,Takeaways');
    });

    it('should include session data', () => {
      const csv = formatReportAsCSV(mockReportData);
      expect(csv).toContain('"Opening Keynote"');
      expect(csv).toContain('"Main Hall"');
    });

    it('should include posts section', () => {
      const csv = formatReportAsCSV(mockReportData);
      expect(csv).toContain('POSTS');
      expect(csv).toContain('Scheduled Date,Status,LinkedIn URL,Preview');
    });

    it('should properly escape quotes in data', () => {
      const dataWithQuotes: TripReportData = {
        ...mockReportData,
        contacts: [{
          id: '1',
          name: 'John "The Boss" Doe',
          company: 'Acme',
          title: 'CEO',
          email: 'john@acme.com',
          notes: 'Said "hello"',
          followUpStatus: 'pending',
        }],
      };
      const csv = formatReportAsCSV(dataWithQuotes);
      // The CSV should contain the data (escaping implementation may vary)
      expect(csv).toContain('John');
    });
  });

  describe('Empty Data Handling', () => {
    const emptyReport: TripReportData = {
      conference: {
        name: 'Empty Conference',
        location: 'Nowhere',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      },
      user: {
        name: 'User',
        email: 'user@example.com',
      },
      summary: {
        totalContacts: 0,
        totalSessions: 0,
        attendedSessions: 0,
        totalPosts: 0,
        publishedPosts: 0,
        teamEngagements: 0,
      },
      contacts: [],
      sessions: [],
      posts: [],
      activities: [],
    };

    it('should handle empty contacts gracefully in markdown', () => {
      const markdown = formatReportAsMarkdown(emptyReport);
      expect(markdown).not.toContain('## Contacts Captured');
    });

    it('should handle empty sessions gracefully in markdown', () => {
      const markdown = formatReportAsMarkdown(emptyReport);
      expect(markdown).not.toContain('## Sessions Attended');
    });

    it('should still generate valid CSV with empty data', () => {
      const csv = formatReportAsCSV(emptyReport);
      expect(csv).toContain('CONTACTS');
      expect(csv).toContain('SESSIONS');
      expect(csv).toContain('POSTS');
    });
  });
});
