-- LOTF 2026 Campaign Seed Data (FIXED VERSION)
-- Script: seed-lotf-campaign-fixed.sql

DO $$
DECLARE
    v_conference_id UUID;
    v_anuj_id UUID;
    v_phase_agitate_id UUID;
    v_phase_educate_id UUID;
    v_phase_hype_id UUID;
    v_phase_conference_id UUID;
    v_phase_followup_id UUID;
BEGIN

-- Get LOTF 2026 conference
SELECT id INTO v_conference_id
FROM public.conferences
WHERE name ILIKE '%LOTF%'
LIMIT 1;

IF v_conference_id IS NULL THEN
    RAISE EXCEPTION 'LOTF conference not found. Please create it first.';
END IF;

RAISE NOTICE 'Found conference: %', v_conference_id;

-- Get Anuj's user ID (only user that exists)
SELECT id INTO v_anuj_id
FROM public.users
WHERE full_name ILIKE '%Anuj%'
LIMIT 1;

RAISE NOTICE 'Found Anuj: %', v_anuj_id;

-- ============================================
-- CREATE CAMPAIGN PHASES
-- ============================================
DELETE FROM public.campaign_phases WHERE conference_id = v_conference_id;

INSERT INTO public.campaign_phases (conference_id, name, description, week_start, week_end, goal, order_index)
VALUES
    (v_conference_id, 'Agitate', 'Stir up pain points around data readiness', 1, 2, 'Create awareness of the Clean ≠ Ready problem', 1),
    (v_conference_id, 'Educate', 'Explain the 4 Dimensions framework', 3, 4, 'Position Data Compass as the solution', 2),
    (v_conference_id, 'Hype', 'Build excitement for the conference', 5, 6, 'Drive booth traffic and meeting bookings', 3),
    (v_conference_id, 'Conference', 'Real-time conference coverage', 6, 6, 'Maximize visibility during the event', 4),
    (v_conference_id, 'Follow-Up', 'Convert connections to demos', 7, 7, 'Schedule demos and nurture leads', 5);

-- Get phase IDs
SELECT id INTO v_phase_agitate_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Agitate' LIMIT 1;
SELECT id INTO v_phase_educate_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Educate' LIMIT 1;
SELECT id INTO v_phase_hype_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Hype' LIMIT 1;
SELECT id INTO v_phase_conference_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Conference' LIMIT 1;
SELECT id INTO v_phase_followup_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Follow-Up' LIMIT 1;

RAISE NOTICE 'Created campaign phases';

-- ============================================
-- CREATE TEAM PERSONA FOR ANUJ
-- ============================================
IF v_anuj_id IS NOT NULL THEN
    DELETE FROM public.team_personas WHERE conference_id = v_conference_id AND user_id = v_anuj_id;

    INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
    VALUES (
        v_conference_id,
        v_anuj_id,
        'The Visionary Architect',
        'Strategy, Organizational Risk, "The System is Broken"',
        'Authoritative, challenging',
        ARRAY['Asset Maturity vs. Execution Risk (Pg 28)']
    );
    RAISE NOTICE 'Created persona for Anuj';
END IF;

-- ============================================
-- CREATE CONTENT LIBRARY
-- ============================================
DELETE FROM public.content_library WHERE conference_id = v_conference_id;

INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'statistic', 'AI Failure Rate', '87% of AI projects fail', 'Industry research'),
    (v_conference_id, 'statistic', 'Data Initiative Failure', '70% of data initiatives fail', 'Slide Pg 21'),
    (v_conference_id, 'framework', 'North Definition', 'North (Statistical Health): Can the data learn?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'East Definition', 'East (Semantic Clarity): Can AI reason with it?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'South Definition', 'South (Contextual Validity): Is it measuring the right thing?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'West Definition', 'West (Governance & Safety): Can you use it safely?', 'Data Compass Framework'),
    (v_conference_id, 'hashtag', 'Conference', '#LabOfTheFuture #LotF2026', 'Conference branding'),
    (v_conference_id, 'hashtag', 'Product', '#DataCompass #AIReadiness', 'Product branding'),
    (v_conference_id, 'cta', 'DM for Scorecard', 'DM me if you want to see our readiness scorecard.', 'Campaign'),
    (v_conference_id, 'cta', 'Who is Going', 'Who is going to be in Boston?', 'Campaign');

RAISE NOTICE 'Created content library';

-- ============================================
-- CREATE POSTS - ALL 46 POSTS
-- ============================================
DELETE FROM public.posts WHERE conference_id = v_conference_id;

-- Week 1 Posts (Agitate Phase)
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 7, 'linkedin', 'draft', 1, 'Tue', v_phase_agitate_id,
'The $5M Mistake',
E'We spend millions on ''Clean Data''—no duplicates, right formats. Yet 87% of AI projects fail. Why? Because Clean ≠ Ready.\n\nClean is a spreadsheet. Ready is a Compass. We need to navigate 4 dimensions, not just one.\n\nIf you''re going to #LabOfTheFuture, ask yourself: is your data ready, or just clean?',
'Text Only', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 8, 'linkedin', 'draft', 1, 'Wed', v_phase_agitate_id,
'The Proxy Problem',
E'I''m prepping for #LotF2026 and thinking about Hans Clevers'' upcoming talk on rewriting rules.\n\nOne rule we must break: using demographic proxies for biology.\n\nThis is South (Contextual Validity) on the Data Compass—and it''s the most ignored direction.\n\nIf you aren''t looking South, you aren''t predicting biology; you''re predicting healthcare access.',
'Slide: The Proxy Problem (Page 19)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 9, 'linkedin', 'draft', 1, 'Thu', v_phase_agitate_id,
'The Networking Hook',
E'Reviewing the #LotF2026 agenda. Huge lineup from Takeda and Roche.\n\nI''m looking to speak with leaders who are tired of their AI pilots stalling because they lack a navigation system for their data.\n\nWho is going to be in Boston?',
'Photo of Conference Agenda', TRUE);

-- Week 2 Posts (Agitate Phase)
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 14, 'linkedin', 'draft', 2, 'Tue', v_phase_agitate_id,
'Asset vs. Execution',
E'Most failures I see happen in the top-left quadrant: High Asset Maturity (great data), Low Execution Readiness (resistant teams).\n\nWe need to measure both.\n\nExcited to discuss the full equation in Boston.',
'Slide: Asset vs Execution Matrix (Page 28)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 15, 'linkedin', 'draft', 2, 'Wed', v_phase_agitate_id,
'Ontology & Silos',
E'Automation is useless if the robots don''t speak the same language.\n\nIf you''re attending Sam Michael''s (GSK) session on automation, ask: Are we building data silos at high speed?\n\nWe need East (Semantic Clarity) to fix this. #FAIRData #Ontology',
'Slide: Ontology Management (Page 14)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 16, 'linkedin', 'draft', 2, 'Thu', v_phase_agitate_id,
'Table Stakes Rant',
E'Unpopular opinion: ''Data Governance'' has become a boring compliance checkbox.\n\nIt needs to be an engineering constraint. This is West (Governance) on our compass—it protects the whole journey.\n\nIf you want to see what active governance looks like, find me at #LotF.',
'Text Only', TRUE);

-- Week 3 Posts (Educate Phase)
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 21, 'linkedin', 'draft', 3, 'Tue', v_phase_educate_id,
'The 4 Dimensions',
E'We need a compass for AI readiness.\n\nNorth: Statistical Health\nEast: Semantic Clarity\nSouth: Contextual Validity\nWest: Governance & Safety\n\nWhich direction is your organization ignoring? #AIReadiness',
'Slide: 4 Dimensions Compass (Page 3)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 22, 'linkedin', 'draft', 3, 'Wed', v_phase_educate_id,
'Semantic Clarity',
E'Looking forward to Julia Fox''s (Takeda) talk on Semantic Tools.\n\nWe can''t have AI ''reason'' if data lacks definitions. This is East on the Compass.\n\nLevel 1 is a match. Level 3 is inference.\n\nWhere is your lab?',
'Slide: ML-Hybrid Ontology (Page 13)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 23, 'linkedin', 'draft', 3, 'Thu', v_phase_educate_id,
'Execution Risk',
E'70% of data initiatives fail. It''s usually people, not tech.\n\nI''m heading to Boston to talk about the ''Execution'' side of the equation.\n\nDM me if you want to see our readiness scorecard.',
'Slide: 70% Failure Stat (Page 21)', TRUE);

-- Week 4 Posts (Educate Phase)
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 28, 'linkedin', 'draft', 4, 'Tue', v_phase_educate_id,
'Soft Launch',
E'We''ve been working on something that automates the ''Ready'' assessment across all 4 dimensions.\n\nIt''s called Data Compass.\n\nWe''ll be demoing how it solves the Proxy Problem live in Boston. #DataCompass #Launch',
'Image: Product Logo/Teaser', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 29, 'linkedin', 'draft', 4, 'Wed', v_phase_educate_id,
'Automating Fairness',
E'Humans can''t check millions of rows for bias. Algorithms can.\n\nI''ll be showing how we calculate Shannon entropy for demographic representation on the fly.\n\nCatch me after Yves Fomekong Nanfack''s session.',
'Slide: Bias Assessment Dashboard (Page 6)', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 30, 'linkedin', 'draft', 4, 'Thu', v_phase_educate_id,
'Calendar Drop',
E'My calendar for Boston is filling up.\n\nI have 4 slots left for anyone who wants a 15-minute ''Readiness Audit'' of their current strategy.\n\nFirst come, first served.',
'Calendly link', TRUE);

-- Week 5 Posts (Hype Phase)
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 35, 'linkedin', 'draft', 5, 'Tue', v_phase_hype_id,
'The Challenge',
E'I challenge every speaker at #LotF to answer one question:\n\nHow do you measure North (Statistical Health)?\n\nIs your data learning-ready, or just filled out?\n\nLooking at you Christopher Arendt and Amrik Mahal—can''t wait to hear your take!',
'Tagged Speaker Photos', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 36, 'linkedin', 'draft', 5, 'Wed', v_phase_hype_id,
'Science Deep Dive',
E'Excited for the parallel sessions on Day 2 of #LotF2026.\n\nI''ll be at Petrina Kamya''s (Insilico) talk on autonomous labs.\n\nKey question: How do you validate outputs when the lab runs itself? That''s where West (Governance) becomes critical.',
'Session Schedule', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 37, 'linkedin', 'draft', 5, 'Thu', v_phase_hype_id,
'Pre-Conference Networking',
E'3 days until #LotF2026!\n\nFind us at the opening reception. I''ll be the one asking uncomfortable questions about your data strategy.\n\nSeriously though - let''s connect. The best conversations happen outside the sessions.',
'Photo: Team headshots', TRUE);

-- Week 6 - Conference Week Posts
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 42, 'linkedin', 'draft', 6, 'Mon', v_phase_conference_id,
'Day 0: Arrival',
E'Just landed in Boston for #LotF2026! ✈️\n\nTomorrow kicks off with Hans Clevers. Can''t wait to hear his take on rewriting the rules.\n\nIf you''re here, drop a comment - let''s grab coffee.',
'Photo: Boston skyline/airport', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 43, 'linkedin', 'draft', 6, 'Tue', v_phase_conference_id,
'Day 1 Morning: Opening',
E'🔴 LIVE from #LotF2026\n\nHans Clevers just dropped: "The biggest barrier to AI in pharma isn''t the algorithm—it''s the data culture."\n\nThis is exactly why we built Data Compass. Culture is West on the compass.',
'Photo: Keynote stage', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 43, 'linkedin', 'draft', 6, 'Tue', v_phase_conference_id,
'Day 1 Afternoon: Booth Traffic',
E'Incredible conversations at our booth today!\n\nTop question: "How do you handle legacy data that''s never been validated?"\n\nAnswer: Start with South (Contextual Validity). Does it even measure what you think it measures?\n\n#LotF2026',
'Photo: Booth with visitors', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 44, 'linkedin', 'draft', 6, 'Wed', v_phase_conference_id,
'Day 2 Morning: Automation Session',
E'Sam Michael (GSK) on automation: "Speed without semantics is just faster chaos."\n\n💯 This is East on the compass. You need ontologies BEFORE you scale.\n\n#LotF2026 #Automation',
'Photo: Session slide', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 44, 'linkedin', 'draft', 6, 'Wed', v_phase_conference_id,
'Day 2 Afternoon: Demo Success',
E'Just finished a live demo of Data Compass for a group from Roche.\n\nTheir reaction when they saw the bias detection on their own dataset: 😮\n\nThis is why we do this. #LotF2026',
'Photo: Demo screen', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 45, 'linkedin', 'draft', 6, 'Thu', v_phase_conference_id,
'Day 3: Final Day',
E'Last day of #LotF2026!\n\nKey takeaway: Everyone''s talking about AI, but few are talking about AI-READY data.\n\nThat''s the gap. That''s what we solve.\n\nThanks to everyone who stopped by our booth!',
'Photo: Team at booth', TRUE);

-- Week 7 - Follow-Up Phase
INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required) VALUES
(v_conference_id, v_anuj_id, CURRENT_DATE + 49, 'linkedin', 'draft', 7, 'Mon', v_phase_followup_id,
'Conference Recap',
E'Back from #LotF2026 with a full notebook and a packed calendar.\n\n3 key themes I heard repeatedly:\n1. Data culture > Data tech\n2. Ontologies are underinvested\n3. Governance is seen as a blocker, not an enabler\n\nSound familiar?',
'Photo: Notebook/notes', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 50, 'linkedin', 'draft', 7, 'Tue', v_phase_followup_id,
'Following Up',
E'To everyone I met at #LotF2026:\n\nI''m scheduling follow-up calls this week. If we talked about your data readiness challenges, check your inbox.\n\nIf we didn''t connect but should have - DM me. Let''s fix that.',
'Text Only', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 51, 'linkedin', 'draft', 7, 'Wed', v_phase_followup_id,
'Testimonial Share',
E'"Finally, someone who understands that clean data isn''t the same as useful data." - Director of Data Science at [Pharma Co]\n\nThis conversation at #LotF2026 made my week. The awareness is growing.',
'Quote graphic', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 52, 'linkedin', 'draft', 7, 'Thu', v_phase_followup_id,
'Resource Drop',
E'Many of you asked for the slides from our #LotF2026 demo.\n\nHere''s the key framework: The Data Compass - 4 dimensions of AI readiness.\n\nDM for the full deck.',
'Slide: 4 Dimensions overview', TRUE),

(v_conference_id, v_anuj_id, CURRENT_DATE + 56, 'linkedin', 'draft', 7, 'Mon', v_phase_followup_id,
'Week 2 Follow-Up',
E'Still processing all the insights from #LotF2026.\n\nOne thing is clear: the industry is ready for a new approach to data readiness.\n\nWe''re booking demos through February. Link in comments.',
'Calendly graphic', TRUE);

RAISE NOTICE 'Created all posts';
RAISE NOTICE 'Seed complete!';

END $$;

-- Verify the data
SELECT 'Phases:' as type, COUNT(*) as count FROM public.campaign_phases;
SELECT 'Posts:' as type, COUNT(*) as count FROM public.posts;
SELECT 'Content Library:' as type, COUNT(*) as count FROM public.content_library;
