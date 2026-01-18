import { supabase } from '@/services/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface TripReportData {
  conference: {
    name: string;
    location?: string;
    startDate: string;
    endDate: string;
  };
  user: {
    name: string;
    email: string;
  };
  summary: {
    totalContacts: number;
    totalSessions: number;
    attendedSessions: number;
    totalPosts: number;
    publishedPosts: number;
    teamEngagements: number;
  };
  contacts: {
    id: string;
    name: string;
    company?: string;
    title?: string;
    email?: string;
    notes?: string;
    followUpStatus: string;
  }[];
  sessions: {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    status: string;
    takeaways?: string;
  }[];
  posts: {
    id: string;
    scheduledDate: string;
    status: string;
    contentPreview?: string;
    linkedinUrl?: string;
  }[];
  activities: {
    date: string;
    type: string;
    description: string;
  }[];
}

export async function generateTripReport(
  conferenceId: string,
  userId: string
): Promise<TripReportData> {
  // Fetch conference info
  const { data: conference } = await supabase
    .from('conferences')
    .select('*')
    .eq('id', conferenceId)
    .single();

  // Fetch user info
  const { data: userData } = await supabase.auth.getUser();

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('captured_by', userId)
    .order('created_at', { ascending: false });

  // Fetch sessions with attendance
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      session_attendance!inner (*)
    `)
    .eq('conference_id', conferenceId)
    .eq('session_attendance.user_id', userId)
    .order('start_time', { ascending: true });

  // Fetch all sessions for total count
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('conference_id', conferenceId);

  // Fetch posts by user
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('author_id', userId)
    .order('scheduled_date', { ascending: true });

  // Fetch all posts for engagement count
  const { data: allPosts } = await supabase
    .from('posts')
    .select(`
      id,
      post_engagements (*)
    `)
    .eq('conference_id', conferenceId);

  // Count user's engagements
  const userEngagements = allPosts?.reduce((sum, post) => {
    const userEngaged = post.post_engagements?.some(
      (e: any) => e.user_id === userId
    );
    return sum + (userEngaged ? 1 : 0);
  }, 0) || 0;

  // Fetch activities
  const { data: activities } = await supabase
    .from('team_activities')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate summary
  const attendedCount = sessions?.filter(
    (s: any) => s.session_attendance?.[0]?.status === 'attended'
  ).length || 0;
  const publishedCount = posts?.filter((p) => p.status === 'published').length || 0;

  return {
    conference: {
      name: conference?.name || 'Unknown Conference',
      location: conference?.location,
      startDate: conference?.start_date || '',
      endDate: conference?.end_date || '',
    },
    user: {
      name: userData?.user?.user_metadata?.full_name || 'Team Member',
      email: userData?.user?.email || '',
    },
    summary: {
      totalContacts: contacts?.length || 0,
      totalSessions: allSessions?.length || 0,
      attendedSessions: attendedCount,
      totalPosts: posts?.length || 0,
      publishedPosts: publishedCount,
      teamEngagements: userEngagements,
    },
    contacts: (contacts || []).map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      company: c.company,
      title: c.title,
      email: c.email,
      notes: c.notes,
      followUpStatus: c.follow_up_status,
    })),
    sessions: (sessions || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      date: new Date(s.start_time).toLocaleDateString(),
      time: new Date(s.start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      location: s.location,
      status: s.session_attendance?.[0]?.status || 'unknown',
      takeaways: s.session_attendance?.[0]?.key_takeaways,
    })),
    posts: (posts || []).map((p) => ({
      id: p.id,
      scheduledDate: p.scheduled_date,
      status: p.status,
      contentPreview: p.content_preview,
      linkedinUrl: p.linkedin_url,
    })),
    activities: (activities || []).map((a) => ({
      date: new Date(a.created_at).toLocaleDateString(),
      type: a.activity_type,
      description: a.description,
    })),
  };
}

export function formatReportAsMarkdown(report: TripReportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Trip Report: ${report.conference.name}`);
  lines.push('');
  lines.push(`**Prepared by:** ${report.user.name} (${report.user.email})`);
  lines.push(`**Conference Dates:** ${report.conference.startDate} to ${report.conference.endDate}`);
  if (report.conference.location) {
    lines.push(`**Location:** ${report.conference.location}`);
  }
  lines.push(`**Report Generated:** ${new Date().toLocaleDateString()}`);
  lines.push('');

  // Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Contacts Captured | ${report.summary.totalContacts} |`);
  lines.push(`| Sessions Attended | ${report.summary.attendedSessions} of ${report.summary.totalSessions} |`);
  lines.push(`| Posts Published | ${report.summary.publishedPosts} of ${report.summary.totalPosts} |`);
  lines.push(`| Team Engagements | ${report.summary.teamEngagements} |`);
  lines.push('');

  // Contacts
  if (report.contacts.length > 0) {
    lines.push('## Contacts Captured');
    lines.push('');
    lines.push('| Name | Company | Title | Follow-up Status |');
    lines.push('|------|---------|-------|------------------|');
    report.contacts.forEach((c) => {
      lines.push(`| ${c.name} | ${c.company || '-'} | ${c.title || '-'} | ${c.followUpStatus} |`);
    });
    lines.push('');

    // Contact details with notes
    lines.push('### Contact Details');
    lines.push('');
    report.contacts.forEach((c) => {
      lines.push(`#### ${c.name}`);
      if (c.company) lines.push(`- **Company:** ${c.company}`);
      if (c.title) lines.push(`- **Title:** ${c.title}`);
      if (c.email) lines.push(`- **Email:** ${c.email}`);
      if (c.notes) lines.push(`- **Notes:** ${c.notes}`);
      lines.push('');
    });
  }

  // Sessions
  if (report.sessions.length > 0) {
    lines.push('## Sessions Attended');
    lines.push('');
    lines.push('| Date | Time | Session | Location | Status |');
    lines.push('|------|------|---------|----------|--------|');
    report.sessions.forEach((s) => {
      lines.push(`| ${s.date} | ${s.time} | ${s.title} | ${s.location || '-'} | ${s.status} |`);
    });
    lines.push('');

    // Session takeaways
    const withTakeaways = report.sessions.filter((s) => s.takeaways);
    if (withTakeaways.length > 0) {
      lines.push('### Key Takeaways');
      lines.push('');
      withTakeaways.forEach((s) => {
        lines.push(`#### ${s.title}`);
        lines.push(s.takeaways!);
        lines.push('');
      });
    }
  }

  // Posts
  if (report.posts.length > 0) {
    lines.push('## Social Media Posts');
    lines.push('');
    lines.push('| Date | Status | Preview |');
    lines.push('|------|--------|---------|');
    report.posts.forEach((p) => {
      const preview = p.contentPreview?.substring(0, 50) + '...' || '-';
      lines.push(`| ${p.scheduledDate} | ${p.status} | ${preview} |`);
    });
    lines.push('');
  }

  // Activity Log
  if (report.activities.length > 0) {
    lines.push('## Activity Log');
    lines.push('');
    report.activities.slice(0, 20).forEach((a) => {
      lines.push(`- **${a.date}** - ${a.type}: ${a.description}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('*Generated by Conference Compass*');

  return lines.join('\n');
}

export function formatReportAsCSV(report: TripReportData): string {
  const lines: string[] = [];

  // Contacts CSV
  lines.push('CONTACTS');
  lines.push('Name,Company,Title,Email,Follow-up Status,Notes');
  report.contacts.forEach((c) => {
    lines.push(`"${c.name}","${c.company || ''}","${c.title || ''}","${c.email || ''}","${c.followUpStatus}","${c.notes || ''}"`);
  });
  lines.push('');

  // Sessions CSV
  lines.push('SESSIONS');
  lines.push('Date,Time,Title,Location,Status,Takeaways');
  report.sessions.forEach((s) => {
    lines.push(`"${s.date}","${s.time}","${s.title}","${s.location || ''}","${s.status}","${s.takeaways || ''}"`);
  });
  lines.push('');

  // Posts CSV
  lines.push('POSTS');
  lines.push('Scheduled Date,Status,LinkedIn URL,Preview');
  report.posts.forEach((p) => {
    lines.push(`"${p.scheduledDate}","${p.status}","${p.linkedinUrl || ''}","${p.contentPreview || ''}"`);
  });

  return lines.join('\n');
}

export async function exportReport(
  report: TripReportData,
  format: 'markdown' | 'csv'
): Promise<string> {
  const content = format === 'markdown'
    ? formatReportAsMarkdown(report)
    : formatReportAsCSV(report);

  const filename = `trip-report-${report.conference.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : 'csv'}`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filepath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filepath);
  }

  return filepath;
}
