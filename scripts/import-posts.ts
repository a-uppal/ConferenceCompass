/**
 * Post Calendar Import Script
 *
 * Imports social media post schedule from various sources:
 * - LOTF Strategy Excel document
 * - CSV file with post schedule
 * - Manual JSON data
 *
 * Usage:
 *   npx ts-node scripts/import-posts.ts --conference-id=<uuid> --source=<path>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// You'll need to set these environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PostInput {
  author_email: string; // Will be resolved to user ID
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM
  platform: 'linkedin' | 'twitter' | 'other';
  content_preview?: string;
  post_type?: string;
  week_number?: number;
}

// Sample LOTF 2026 post calendar (replace with actual import)
const sampleLOTFPosts: PostInput[] = [
  // Week -2: Pre-conference buzz
  {
    author_email: 'anuj@compassdata.io',
    scheduled_date: '2026-01-27',
    scheduled_time: '09:00',
    platform: 'linkedin',
    content_preview: 'Excited to be heading to #LOTF2026 next week! Looking forward to connecting with data leaders about FAIR principles and AI readiness.',
    post_type: 'Pre-event excitement',
    week_number: -2,
  },
  {
    author_email: 'sarah@compassdata.io',
    scheduled_date: '2026-01-28',
    scheduled_time: '10:00',
    platform: 'linkedin',
    content_preview: 'Getting ready for Life on the FAIR 2026! Can\'t wait to discuss how we\'re helping pharma companies transform their data governance.',
    post_type: 'Pre-event excitement',
    week_number: -2,
  },
  // Week -1: Building anticipation
  {
    author_email: 'mike@compassdata.io',
    scheduled_date: '2026-02-03',
    scheduled_time: '08:30',
    platform: 'linkedin',
    content_preview: 'One week until #LOTF2026! Here\'s what I\'m most excited about: The session on AI/ML Readiness for Drug Discovery.',
    post_type: 'Countdown',
    week_number: -1,
  },
  {
    author_email: 'anuj@compassdata.io',
    scheduled_date: '2026-02-05',
    scheduled_time: '11:00',
    platform: 'linkedin',
    content_preview: 'If you\'re attending LOTF 2026, come find us! We\'ll be demoing FAIR Compass and discussing how to assess your data\'s AI readiness.',
    post_type: 'Meeting invitation',
    week_number: -1,
  },
  // Week 0: During conference
  {
    author_email: 'anuj@compassdata.io',
    scheduled_date: '2026-02-10',
    scheduled_time: '08:00',
    platform: 'linkedin',
    content_preview: 'Day 1 at #LOTF2026! Just arrived and ready to connect. If you\'re here, let\'s chat about data quality and FAIR principles.',
    post_type: 'Day 1 opening',
    week_number: 0,
  },
  {
    author_email: 'sarah@compassdata.io',
    scheduled_date: '2026-02-10',
    scheduled_time: '14:00',
    platform: 'linkedin',
    content_preview: 'Great discussion at the FAIR Principles workshop! Key insight: Most organizations score below 50% on FAIR compliance. How does yours compare?',
    post_type: 'Session insight',
    week_number: 0,
  },
  {
    author_email: 'mike@compassdata.io',
    scheduled_date: '2026-02-11',
    scheduled_time: '09:30',
    platform: 'linkedin',
    content_preview: 'Day 2 at #LOTF2026 - The panel on regulatory AI compliance was eye-opening. FDA guidance is evolving fast!',
    post_type: 'Day 2 insight',
    week_number: 0,
  },
  {
    author_email: 'anuj@compassdata.io',
    scheduled_date: '2026-02-11',
    scheduled_time: '16:00',
    platform: 'linkedin',
    content_preview: 'Wrapping up an amazing #LOTF2026! Met incredible data leaders and had great conversations about the future of pharma data.',
    post_type: 'Closing reflection',
    week_number: 0,
  },
  // Week +1: Follow-up content
  {
    author_email: 'sarah@compassdata.io',
    scheduled_date: '2026-02-17',
    scheduled_time: '10:00',
    platform: 'linkedin',
    content_preview: 'Reflecting on #LOTF2026 - My top 3 takeaways about FAIR data in life sciences: 1. Metadata is king 2. Ontologies matter 3. Start small, scale fast',
    post_type: 'Recap/reflection',
    week_number: 1,
  },
  {
    author_email: 'anuj@compassdata.io',
    scheduled_date: '2026-02-19',
    scheduled_time: '09:00',
    platform: 'linkedin',
    content_preview: 'Thank you to everyone who stopped by at #LOTF2026! Following up with all the great conversations we had about data quality assessment.',
    post_type: 'Thank you post',
    week_number: 1,
  },
  // Week +2: Thought leadership
  {
    author_email: 'mike@compassdata.io',
    scheduled_date: '2026-02-24',
    scheduled_time: '11:00',
    platform: 'linkedin',
    content_preview: 'Based on conversations at #LOTF2026, here\'s my take on the biggest data challenges facing pharma in 2026...',
    post_type: 'Thought leadership',
    week_number: 2,
  },
  {
    author_email: 'sarah@compassdata.io',
    scheduled_date: '2026-02-26',
    scheduled_time: '10:00',
    platform: 'linkedin',
    content_preview: 'The ML readiness gap: What we learned at #LOTF2026 about why 80% of data science projects fail before they start.',
    post_type: 'Insight article',
    week_number: 2,
  },
];

async function resolveUserIds(posts: PostInput[]): Promise<Map<string, string>> {
  const emails = [...new Set(posts.map((p) => p.author_email))];
  const userMap = new Map<string, string>();

  for (const email of emails) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (user) {
      userMap.set(email, user.id);
    } else {
      console.warn(`User not found for email: ${email}`);
    }
  }

  return userMap;
}

async function importPosts(conferenceId: string, posts: PostInput[]) {
  console.log(`Importing ${posts.length} posts to conference ${conferenceId}...`);

  // Resolve user IDs from emails
  const userMap = await resolveUserIds(posts);

  for (const postData of posts) {
    const authorId = userMap.get(postData.author_email);

    if (!authorId) {
      console.error(`Skipping post - no user found for: ${postData.author_email}`);
      continue;
    }

    const { error } = await supabase.from('posts').insert({
      conference_id: conferenceId,
      author_id: authorId,
      scheduled_date: postData.scheduled_date,
      scheduled_time: postData.scheduled_time,
      platform: postData.platform,
      content_preview: postData.content_preview,
      post_type: postData.post_type,
      week_number: postData.week_number,
      status: 'scheduled',
    });

    if (error) {
      console.error(`Error inserting post for ${postData.author_email}:`, error);
      continue;
    }

    console.log(`✓ Imported post: ${postData.scheduled_date} - ${postData.author_email}`);
  }

  console.log('\nImport complete!');
}

async function importFromCSV(conferenceId: string, csvPath: string) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const posts: PostInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });

    posts.push({
      author_email: row.author_email || row.email || row.author || '',
      scheduled_date: row.scheduled_date || row.date || '',
      scheduled_time: row.scheduled_time || row.time || '',
      platform: (row.platform || 'linkedin') as 'linkedin' | 'twitter' | 'other',
      content_preview: row.content_preview || row.content || row.preview || '',
      post_type: row.post_type || row.type || '',
      week_number: parseInt(row.week_number || row.week || '0', 10),
    });
  }

  await importPosts(conferenceId, posts);
}

async function importFromJSON(conferenceId: string, jsonPath: string) {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const posts: PostInput[] = JSON.parse(content);
  await importPosts(conferenceId, posts);
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
    console.error('Usage: npx ts-node scripts/import-posts.ts --conference-id=<uuid> [--source=<path>]');
    console.error('\nIf no source is provided, sample LOTF post calendar will be imported.');
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
    console.log('No source file provided. Importing sample LOTF 2026 post calendar...');
    await importPosts(conferenceId, sampleLOTFPosts);
  }
}

main().catch(console.error);
