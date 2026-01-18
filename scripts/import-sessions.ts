/**
 * Session Import Script
 *
 * Imports conference sessions from various sources:
 * - CSV file with session schedule
 * - Speaker Talking Points Excel
 * - Manual JSON data
 *
 * Usage:
 *   npx ts-node scripts/import-sessions.ts --conference-id=<uuid> --source=<path>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// You'll need to set these environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SessionInput {
  title: string;
  description?: string;
  speaker_name?: string;
  speaker_company?: string;
  location?: string;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  session_type?: string;
  track?: string;
  talking_points?: TalkingPointInput[];
}

interface TalkingPointInput {
  content: string;
  category?: string;
  priority?: number;
}

// Sample LOTF 2026 session data (replace with actual import)
const sampleLOTFSessions: SessionInput[] = [
  {
    title: 'Opening Keynote: The Future of Data in Life Sciences',
    description: 'Welcome address and industry outlook for 2026 and beyond.',
    speaker_name: 'Dr. Sarah Chen',
    speaker_company: 'BioTech Innovations',
    location: 'Grand Ballroom A',
    start_time: '2026-02-10T09:00:00Z',
    end_time: '2026-02-10T10:00:00Z',
    session_type: 'Keynote',
    track: 'Main Stage',
    talking_points: [
      { content: 'How does your organization approach data governance?', category: 'Discovery', priority: 1 },
      { content: 'FAIR Compass can help assess data quality across your portfolio', category: 'Value Prop', priority: 2 },
      { content: 'What are your biggest challenges with data findability?', category: 'Pain Point', priority: 3 },
    ],
  },
  {
    title: 'Panel: AI/ML Readiness for Drug Discovery',
    description: 'Industry experts discuss preparing data for machine learning applications.',
    speaker_name: 'Multiple Speakers',
    speaker_company: 'Various',
    location: 'Conference Room 1',
    start_time: '2026-02-10T10:30:00Z',
    end_time: '2026-02-10T12:00:00Z',
    session_type: 'Panel',
    track: 'AI & Data Science',
    talking_points: [
      { content: 'Our ML Readiness assessment identifies data quality issues before model training', category: 'Value Prop', priority: 1 },
      { content: 'What percentage of your data science projects fail due to data quality?', category: 'Pain Point', priority: 2 },
      { content: 'Ask about their current data validation processes', category: 'Discovery', priority: 3 },
    ],
  },
  {
    title: 'Workshop: Implementing FAIR Principles in Practice',
    description: 'Hands-on workshop for implementing Findable, Accessible, Interoperable, Reusable data.',
    speaker_name: 'Dr. Michael Torres',
    speaker_company: 'FAIR Data Institute',
    location: 'Workshop Room A',
    start_time: '2026-02-10T14:00:00Z',
    end_time: '2026-02-10T17:00:00Z',
    session_type: 'Workshop',
    track: 'Data Governance',
    talking_points: [
      { content: 'FAIR Compass provides automated FAIR scoring for your datasets', category: 'Value Prop', priority: 1 },
      { content: 'How do you currently measure FAIR compliance?', category: 'Discovery', priority: 2 },
      { content: 'Mention our ontology inference capabilities', category: 'Feature', priority: 3 },
      { content: 'Ask about their metadata management strategy', category: 'Discovery', priority: 4 },
    ],
  },
  {
    title: 'Networking Lunch',
    description: 'Sponsored networking lunch with table discussions.',
    location: 'Exhibit Hall',
    start_time: '2026-02-10T12:00:00Z',
    end_time: '2026-02-10T14:00:00Z',
    session_type: 'Networking',
    track: 'Social',
    talking_points: [
      { content: 'Identify key decision makers to follow up with', category: 'Action', priority: 1 },
      { content: 'Collect business cards from interested parties', category: 'Action', priority: 2 },
    ],
  },
  {
    title: 'Regulatory Compliance in the Age of AI',
    description: 'Understanding FDA guidance on AI/ML-based medical devices and data requirements.',
    speaker_name: 'Jennifer Williams, JD',
    speaker_company: 'Regulatory Affairs Consulting',
    location: 'Conference Room 2',
    start_time: '2026-02-11T09:00:00Z',
    end_time: '2026-02-11T10:30:00Z',
    session_type: 'Presentation',
    track: 'Regulatory',
    talking_points: [
      { content: 'Our ALCOA+ compliance lens validates data integrity for regulatory submissions', category: 'Value Prop', priority: 1 },
      { content: 'Ask about their current audit trail practices', category: 'Discovery', priority: 2 },
      { content: 'FDA 21 CFR Part 11 compliance is built into our platform', category: 'Feature', priority: 3 },
    ],
  },
];

async function importSessions(conferenceId: string, sessions: SessionInput[]) {
  console.log(`Importing ${sessions.length} sessions to conference ${conferenceId}...`);

  for (const sessionData of sessions) {
    const { talking_points, ...session } = sessionData;

    // Insert session
    const { data: insertedSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        conference_id: conferenceId,
        ...session,
      })
      .select()
      .single();

    if (sessionError) {
      console.error(`Error inserting session "${session.title}":`, sessionError);
      continue;
    }

    console.log(`✓ Inserted session: ${session.title}`);

    // Insert talking points if any
    if (talking_points && talking_points.length > 0) {
      const talkingPointsWithSession = talking_points.map((tp, index) => ({
        session_id: insertedSession.id,
        content: tp.content,
        category: tp.category,
        priority: tp.priority ?? index,
      }));

      const { error: tpError } = await supabase
        .from('talking_points')
        .insert(talkingPointsWithSession);

      if (tpError) {
        console.error(`Error inserting talking points for "${session.title}":`, tpError);
      } else {
        console.log(`  ✓ Added ${talking_points.length} talking points`);
      }
    }
  }

  console.log('\nImport complete!');
}

async function importFromCSV(conferenceId: string, csvPath: string) {
  // Read CSV file
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const sessions: SessionInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });

    sessions.push({
      title: row.title || row.session_title || '',
      description: row.description || row.abstract || '',
      speaker_name: row.speaker || row.speaker_name || '',
      speaker_company: row.company || row.speaker_company || '',
      location: row.location || row.room || '',
      start_time: row.start_time || row.start || '',
      end_time: row.end_time || row.end || '',
      session_type: row.type || row.session_type || '',
      track: row.track || '',
    });
  }

  await importSessions(conferenceId, sessions);
}

async function importFromJSON(conferenceId: string, jsonPath: string) {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const sessions: SessionInput[] = JSON.parse(content);
  await importSessions(conferenceId, sessions);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let conferenceId = '';
  let source = '';

  for (const arg of args) {
    if (arg.startsWith('--conference-id=')) {
      conferenceId = arg.split('=')[1];
    } else if (arg.startsWith('--source=')) {
      source = arg.split('=')[1];
    }
  }

  if (!conferenceId) {
    console.error('Usage: npx ts-node scripts/import-sessions.ts --conference-id=<uuid> [--source=<path>]');
    console.error('\nIf no source is provided, sample LOTF data will be imported.');
    process.exit(1);
  }

  if (source) {
    const ext = path.extname(source).toLowerCase();
    if (ext === '.csv') {
      await importFromCSV(conferenceId, source);
    } else if (ext === '.json') {
      await importFromJSON(conferenceId, source);
    } else {
      console.error('Unsupported file format. Use .csv or .json');
      process.exit(1);
    }
  } else {
    // Import sample LOTF data
    console.log('No source file provided. Importing sample LOTF 2026 sessions...');
    await importSessions(conferenceId, sampleLOTFSessions);
  }
}

main().catch(console.error);
