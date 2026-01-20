import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// LOTF 2026 Conference - March 10-11, 2026 in Boston
const CONFERENCE = {
  name: 'Leaders of the Future (LOTF) 2026',
  description: 'The premier conference for pharma R&D digital transformation, lab automation, and AI innovation.',
  location: 'Boston, MA',
  start_date: '2026-03-10',
  end_date: '2026-03-11',
  website: 'https://lotf2026.com',
};

// Day 1 Sessions - March 10, 2026
const DAY1_SESSIONS = [
  // Keynote Morning
  { time: '08:40', title: "Moderator's Introduction and Overview", speaker: 'Julie Huxley-Jones', company: 'Vertex Pharmaceuticals', role: 'VP Research, Pre-clinical and Manufacturing, Data, Technology & Engineering', track: 'Keynote' },
  { time: '08:50', title: 'Data, Biology, and Technology: Rewriting the Rules of Drug Discovery and Development', speaker: 'Hans Clevers', company: 'Roche', role: 'Head of Pharma Research and Early Development', track: 'Keynote' },
  { time: '09:05', title: 'Are Your Tech Stack and Talent Stack Aligned?', speaker: 'Nicole Crane', company: 'Accenture', role: 'Senior Principal', track: 'Keynote' },
  { time: '09:20', title: 'Building the Foundation for Labs of Tomorrow: Where Strategy Meets Skills, Systems and Science', speaker: 'Christopher Arendt', company: 'Takeda', role: 'CSO, Head of Research', track: 'Keynote' },
  { time: '09:35', title: 'Creating a Data Ecosystem That Enables the Lab of the Future', speaker: 'Mark Fish', company: 'Thermo Fisher Scientific', role: 'VP & GM of Digital Lab Solutions', track: 'Keynote' },
  { time: '09:50', title: 'Panel Discussion and Q&A - Opening Keynotes', speaker: 'Julie Huxley-Jones, Hans Clevers, Christopher Arendt, Nicole Crane, Mark Fish', company: 'Multiple', role: 'Panel', track: 'Keynote' },
  { time: '10:15', title: 'Coffee Break and Networking Session', speaker: '', company: '', role: '', track: 'Networking', location: 'Exhibition Room' },

  // Keynote Mid-Morning
  { time: '11:00', title: 'Continued Evolution of "Wet" Lab Research: Lights Out, Self-driving and Human Augmentation?', speaker: 'James Love', company: 'Novo Nordisk', role: 'Vice President, Cross Modalities Workflows', track: 'Keynote' },
  { time: '11:30', title: 'Utilising Data automation and Automotive Tools to Support Biopharma R&D', speaker: 'Sam Michael', company: 'GSK', role: 'VP, Data, Automation & Predictive Sciences', track: 'Keynote' },
  { time: '12:00', title: 'Panel Discussion - Wet Lab Evolution', speaker: 'Sam Michael, James Love', company: 'GSK, Novo Nordisk', role: 'Panel', track: 'Keynote' },

  // Parallel Track A - Data & AI
  { time: '11:00', title: 'Lab of 2030: Capturing Data at Source, Intelligent Orchestration and AI Driven Innovation', speaker: 'Amrik Mahal, Hebe Middlemiss', company: 'AstraZeneca', role: 'Global Head of IT for Research / Senior Director, AI Strategy and Innovation', track: 'Data & AI' },
  { time: '11:00', title: 'From Experiments to Enterprise: Orchestrating Data for the Lab of the Future', speaker: 'Marc Smith', company: 'IDBS', role: 'Lead Product Manager, Process Development', track: 'Data & AI' },
  { time: '11:30', title: 'Creating a Data Ecosystem That Enables the Lab of the Future', speaker: 'Hans Bitter', company: 'Takeda', role: 'Head of Computational Science, Data Strategy & Senior R&D Leadership Team', track: 'Data & AI' },
  { time: '12:00', title: 'Panel Discussion - Data Ecosystem', speaker: 'Mark Borowsky, Amrik Mahal, Hebe Middlemiss, Hans Bitter, Marc Smith', company: 'Multiple', role: 'Panel', track: 'Data & AI' },

  { time: '12:20', title: 'Congress Lunch and Networking', speaker: '', company: '', role: '', track: 'Networking', location: 'Exhibition Room' },

  // Afternoon - AI to Innovate Track
  { time: '13:20', title: 'Driving the Next Frontier of AI-powered Drug Discovery', speaker: 'Yves Fomekong Nanfack', company: 'Takeda', role: 'Head of AI/ML Research', track: 'AI to Innovate' },
  { time: '13:35', title: 'Enabling Scientists Through Digital Innovation and In-Silico Modeling', speaker: 'Ilan Wapinski', company: 'Sanofi', role: 'Head of Digital In-Silico Research', track: 'AI to Innovate' },
  { time: '14:05', title: 'Panel Discussion - AI Drug Discovery', speaker: 'Thrasyvoulos Karydis, Yves Fomekong Nanfack, Ilan Wapinski', company: 'DeepCure, Takeda, Sanofi', role: 'Panel', track: 'AI to Innovate' },

  // Afternoon - Automated Lab Track
  { time: '13:20', title: 'Lab Automation at Boston Seaport Innovation Centre', speaker: 'Jesse Mulcahy', company: 'Eli Lilly and Company', role: 'Genetic Medicine Lab Automation Lead', track: 'Automated Lab' },
  { time: '13:35', title: 'Humanoids and Fully Autonomous Labs', speaker: 'Petrina Kamya', company: 'Insilico Medicine', role: 'VP, Global Head of AI Platforms', track: 'Automated Lab' },
  { time: '14:05', title: 'Panel Discussion - Lab Automation', speaker: 'Jesse Mulcahy, Petrina Kamya', company: 'Eli Lilly, Insilico Medicine', role: 'Panel', track: 'Automated Lab' },

  // Afternoon - Digital Transformation Track
  { time: '13:20', title: 'Pfizer Use Case: Leveraging Agentic AI in Practice', speaker: 'Pamela Sepulveda', company: 'Pfizer', role: 'Director, Digital Strategy', track: 'Digital Transformation' },
  { time: '13:35', title: 'Pfizer Use Case 2: Harnessing Emerging Technologies in R&D', speaker: 'Pamela Sepulveda', company: 'Pfizer', role: 'Director, Digital Strategy', track: 'Digital Transformation' },
  { time: '14:05', title: 'Panel Discussion - Digital Transformation', speaker: 'Pamela Sepulveda', company: 'Pfizer', role: 'Panel', track: 'Digital Transformation' },

  // Mid-Afternoon Sessions
  { time: '14:20', title: 'Scaling AI in R&D Through Foundation Models and Agentic Frameworks', speaker: 'Jorge Reis-Filho', company: 'AstraZeneca', role: 'Chief AI and Data Scientist, Oncology R&D', track: 'AI to Innovate' },
  { time: '14:35', title: 'Unlocking Protein Insights Through Seamless Access to AI Models at Scale', speaker: 'Michail Vlysidis', company: 'AbbVie', role: 'Senior Engineer, Technology II', track: 'AI to Innovate' },
  { time: '15:05', title: 'Panel Discussion - Scaling AI', speaker: 'Mohit Goel, Jorge Reis-Filho, Michail Vlysidis', company: 'Moderna, AstraZeneca, AbbVie', role: 'Panel', track: 'AI to Innovate' },

  { time: '14:20', title: 'The Automated Lab Rollercoaster: Integrating Emerging Technologies Across DMPK', speaker: 'Michael Reilly', company: 'GSK', role: 'Senior Director of World Wide Discovery DMPK and Sample Management', track: 'Automated Lab' },
  { time: '14:35', title: 'Intelligent Automation in Biologics Development', speaker: 'Kristina Lopez, Nicole Medeiros', company: 'J&J Innovative Medicine', role: 'Senior Director - Digital & Automation / Principal Scientist', track: 'Automated Lab' },
  { time: '15:05', title: 'Panel Discussion - Automation Integration', speaker: 'Mike Berke, Michael Reilly, Kristina Lopez, Nicole Medeiros', company: 'Amgen, GSK, J&J', role: 'Panel', track: 'Automated Lab' },

  { time: '14:20', title: 'In-Silico CMC: Accelerating Digital Drug Development', speaker: 'Denise Teotico', company: 'Sanofi', role: 'Senior Director, Digital R&D Product Line Owner, In Silico CMC', track: 'Digital Transformation' },
  { time: '14:35', title: 'Building the Digital Ecosystem for the Lab of the Future', speaker: 'Nevin Gerek Ince', company: 'Novo Nordisk', role: 'Director, Data and Solutions Engineering', track: 'Digital Transformation' },
  { time: '15:05', title: 'Panel Discussion - Digital Ecosystem', speaker: 'Nevin Gerek Ince, Denise Teotico', company: 'Novo Nordisk, Sanofi', role: 'Panel', track: 'Digital Transformation' },

  { time: '15:20', title: 'Afternoon Tea and Networking', speaker: '', company: '', role: '', track: 'Networking', location: 'Exhibition Room' },

  // Late Afternoon Sessions
  { time: '16:05', title: 'Speeding the Clock of Research at Bristol Myers Squibb – A Systems Integration and Automation Case Study', speaker: 'Martina Miteva', company: 'Bristol Myers Squibb', role: 'Director, R&D IT, Instrument Operations & Data Management', track: 'AI to Disrupt' },
  { time: '16:20', title: 'Speeding the Clock of Research at Bristol Myers Squibb – How We are Using Technology to Advance our Science', speaker: 'David Liu', company: 'Bristol Myers Squibb', role: 'Director, R&D IT, Prediction & Insights', track: 'AI to Disrupt' },
  { time: '16:50', title: 'Panel Discussion - BMS Case Study', speaker: 'Al Wang, Martina Miteva, David Liu', company: 'Bristol Myers Squibb', role: 'Panel', track: 'AI to Disrupt' },

  { time: '16:05', title: 'Uniting LIMS, ELN, Reagent Management and Analytical Systems to Enable E2E Digital Continuity', speaker: 'Vimaldev Devaraja', company: 'Johnson and Johnson Innovative Medicine', role: 'Principal Platform Manager', track: 'Connected Lab' },
  { time: '16:20', title: 'Lab-in-a-Loop Strategies that Combine Automated Experimentation with Data-Driven Decision-Making in mRNA Therapeutics', speaker: 'Wan-Chih Su', company: 'Genentech', role: 'Principal Scientist', track: 'Connected Lab' },
  { time: '16:35', title: 'The Next Generation LIMS: Leveraging Modern Cloud Technology to Unify Quality Labs', speaker: 'Justin Lavimodiere', company: 'Veeva Systems', role: 'Senior Director, Veeva LIMS Strategy', track: 'Connected Lab' },
  { time: '16:50', title: 'Panel Discussion - Connected Lab', speaker: 'Tim Hoctor, Wan-Chih Su, Vimaldev Devaraja, Justin Lavimodiere', company: 'Multiple', role: 'Panel', track: 'Connected Lab' },

  { time: '16:05', title: 'A Data Science Ecosystem to Improve Efficiency in Pharma R&D', speaker: 'Dan Gusenleitner', company: 'Bayer', role: 'Mission Lead for the R&D Data Science Ecosystem', track: 'Data Strategy' },
  { time: '16:20', title: 'Semantic Tools for Drug Discovery', speaker: 'Julia Fox', company: 'Takeda', role: 'Director, Data & Analytics', track: 'Data Strategy' },
  { time: '16:50', title: 'Panel Discussion - Data Strategy', speaker: 'Cathy Kuang, Dan Gusenleitner, Julia Fox', company: 'Takeda, Bayer', role: 'Panel', track: 'Data Strategy' },

  // Live Labs
  { time: '17:05', title: 'Live Lab A: Building My Lab of the Future', speaker: 'Julie Huxley-Jones', company: 'Vertex Pharmaceuticals', role: 'VP Research, Pre-clinical and Manufacturing, Data, Technology & Engineering', track: 'Live Lab' },
  { time: '17:05', title: 'Live Lab B: Safety to Fail', speaker: 'Steve Winig', company: 'Novartis', role: 'Executive Director', track: 'Live Lab' },

  { time: '17:35', title: 'Drinks Reception', speaker: '', company: '', role: '', track: 'Networking', location: 'Exhibition Room' },
];

async function importLOTFAgenda() {
  console.log('🚀 Starting LOTF 2026 Agenda Import...\n');

  // Get the current user (you need to be logged in)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Not authenticated. Please log in first.');
    console.log('Run the app and log in, then run this script again.');

    // Try to create conference without user association for now
    console.log('\nAttempting to create conference without user...');
  }

  // Check if conference already exists
  const { data: existingConf } = await supabase
    .from('conferences')
    .select('id')
    .eq('name', CONFERENCE.name)
    .single();

  let conferenceId: string;

  if (existingConf) {
    console.log('📋 Conference already exists, using existing ID');
    conferenceId = existingConf.id;
  } else {
    // Create the conference
    const { data: newConf, error: confError } = await supabase
      .from('conferences')
      .insert({
        name: CONFERENCE.name,
        description: CONFERENCE.description,
        location: CONFERENCE.location,
        start_date: CONFERENCE.start_date,
        end_date: CONFERENCE.end_date,
        // created_by: user?.id, // Optional
      })
      .select()
      .single();

    if (confError) {
      console.error('❌ Error creating conference:', confError.message);
      return;
    }

    conferenceId = newConf.id;
    console.log(`✅ Created conference: ${CONFERENCE.name} (ID: ${conferenceId})`);
  }

  // Import sessions
  console.log(`\n📅 Importing ${DAY1_SESSIONS.length} sessions...`);

  let imported = 0;
  let skipped = 0;

  for (const session of DAY1_SESSIONS) {
    // Parse time to create full datetime (Day 1 = March 10, 2026)
    const [hours, minutes] = session.time.split(':');
    const startTime = new Date(`2026-03-10T${hours}:${minutes}:00-05:00`); // EST timezone

    // Estimate end time (30 min for talks, 15 min for panels, 45 min for networking)
    let durationMins = 30;
    if (session.track === 'Networking') durationMins = 45;
    if (session.title.includes('Panel')) durationMins = 15;
    if (session.title.includes('Live Lab')) durationMins = 45;

    const endTime = new Date(startTime.getTime() + durationMins * 60000);

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('conference_id', conferenceId)
      .eq('title', session.title)
      .eq('start_time', startTime.toISOString())
      .single();

    if (existingSession) {
      skipped++;
      continue;
    }

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        conference_id: conferenceId,
        title: session.title,
        description: session.speaker ? `Speaker: ${session.speaker}\n${session.role}\n${session.company}` : '',
        speaker_name: session.speaker || null,
        speaker_company: session.company || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: session.location || 'Main Hall',
        track: session.track,
      });

    if (sessionError) {
      console.error(`❌ Error importing "${session.title}":`, sessionError.message);
    } else {
      imported++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   - Sessions imported: ${imported}`);
  console.log(`   - Sessions skipped (already exist): ${skipped}`);
  console.log(`\n🎉 LOTF 2026 agenda is ready in Conference Compass!`);
}

importLOTFAgenda().catch(console.error);
