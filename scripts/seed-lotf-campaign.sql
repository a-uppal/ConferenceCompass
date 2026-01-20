-- LOTF 2026 Campaign Seed Data
-- Script: seed-lotf-campaign.sql
-- Created: 2026-01-18
-- Description: Seeds the database with LOTF 2026 social media campaign content
--
-- PREREQUISITES:
-- 1. Run migration 004_social_media_campaign.sql first
-- 2. Ensure LOTF 2026 conference exists in conferences table
-- 3. Ensure team members (Anuj, Nina, Ben) exist in users/team_members tables
--
-- USAGE:
-- Run this script against your Supabase database after migration 004

-- ============================================
-- VARIABLES (update these with actual IDs)
-- ============================================
-- These will be populated by the first queries

DO $$
DECLARE
    v_conference_id UUID;
    v_team_id UUID;
    v_anuj_id UUID;
    v_nina_id UUID;
    v_ben_id UUID;
    v_phase_agitate_id UUID;
    v_phase_educate_id UUID;
    v_phase_hype_id UUID;
    v_phase_conference_id UUID;
    v_phase_followup_id UUID;
BEGIN

-- ============================================
-- GET EXISTING IDS
-- ============================================

-- Get LOTF 2026 conference (or create if not exists)
SELECT id, team_id INTO v_conference_id, v_team_id
FROM public.conferences
WHERE name ILIKE '%LOTF%' OR name ILIKE '%Lab of the Future%'
LIMIT 1;

IF v_conference_id IS NULL THEN
    RAISE NOTICE 'LOTF conference not found. Please create it first.';
    RETURN;
END IF;

RAISE NOTICE 'Found conference: %', v_conference_id;

-- Get team member IDs by name (case-insensitive partial match)
SELECT id INTO v_anuj_id FROM public.users WHERE full_name ILIKE '%Anuj%' LIMIT 1;
SELECT id INTO v_nina_id FROM public.users WHERE full_name ILIKE '%Nina%' LIMIT 1;
SELECT id INTO v_ben_id FROM public.users WHERE full_name ILIKE '%Ben%' LIMIT 1;

-- If users don't exist, we'll skip persona creation
IF v_anuj_id IS NULL THEN
    RAISE NOTICE 'Anuj user not found - personas will be skipped';
END IF;
IF v_nina_id IS NULL THEN
    RAISE NOTICE 'Nina user not found - personas will be skipped';
END IF;
IF v_ben_id IS NULL THEN
    RAISE NOTICE 'Ben user not found - personas will be skipped';
END IF;

-- ============================================
-- CREATE CAMPAIGN PHASES
-- ============================================

INSERT INTO public.campaign_phases (conference_id, name, description, week_start, week_end, goal, order_index)
VALUES
    (v_conference_id, 'Agitate', 'Stir up pain points around data readiness', 1, 2, 'Create awareness of the Clean ≠ Ready problem', 1),
    (v_conference_id, 'Educate', 'Explain the 4 Dimensions framework', 3, 4, 'Position Data Compass as the solution', 2),
    (v_conference_id, 'Hype', 'Build excitement for the conference', 5, 6, 'Drive booth traffic and meeting bookings', 3),
    (v_conference_id, 'Conference', 'Real-time conference coverage', 6, 6, 'Maximize visibility during the event', 4),
    (v_conference_id, 'Follow-Up', 'Convert connections to demos', 7, 7, 'Schedule demos and nurture leads', 5)
ON CONFLICT DO NOTHING
RETURNING id INTO v_phase_agitate_id;

-- Get phase IDs
SELECT id INTO v_phase_agitate_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Agitate' LIMIT 1;
SELECT id INTO v_phase_educate_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Educate' LIMIT 1;
SELECT id INTO v_phase_hype_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Hype' LIMIT 1;
SELECT id INTO v_phase_conference_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Conference' LIMIT 1;
SELECT id INTO v_phase_followup_id FROM public.campaign_phases WHERE conference_id = v_conference_id AND name = 'Follow-Up' LIMIT 1;

RAISE NOTICE 'Created/found campaign phases';

-- ============================================
-- CREATE TEAM PERSONAS
-- ============================================

IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
    VALUES (
        v_conference_id,
        v_anuj_id,
        'The Visionary Architect',
        'Strategy, Organizational Risk, "The System is Broken"',
        'Authoritative, challenging',
        ARRAY['Asset Maturity vs. Execution Risk (Pg 28)']
    )
    ON CONFLICT (conference_id, user_id) DO UPDATE SET
        persona_name = EXCLUDED.persona_name,
        lane = EXCLUDED.lane,
        tone = EXCLUDED.tone,
        key_slides = EXCLUDED.key_slides;
END IF;

IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
    VALUES (
        v_conference_id,
        v_nina_id,
        'The Credible Expert',
        'Methodology, Evidence, "The How"',
        'Peer-to-peer, technical, specific',
        ARRAY['Proxy Problem (Pg 19)', 'Ontology (Pg 12)']
    )
    ON CONFLICT (conference_id, user_id) DO UPDATE SET
        persona_name = EXCLUDED.persona_name,
        lane = EXCLUDED.lane,
        tone = EXCLUDED.tone,
        key_slides = EXCLUDED.key_slides;
END IF;

IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
    VALUES (
        v_conference_id,
        v_ben_id,
        'The Connector',
        'Business Value, ROI, Networking',
        'Energetic, solution-oriented',
        ARRAY['70% Failure Rate (Pg 21)']
    )
    ON CONFLICT (conference_id, user_id) DO UPDATE SET
        persona_name = EXCLUDED.persona_name,
        lane = EXCLUDED.lane,
        tone = EXCLUDED.tone,
        key_slides = EXCLUDED.key_slides;
END IF;

RAISE NOTICE 'Created/updated team personas';

-- ============================================
-- CREATE CONTENT LIBRARY
-- ============================================

-- Statistics
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'statistic', 'AI Failure Rate', '87% of AI projects fail', 'Industry research'),
    (v_conference_id, 'statistic', 'Data Initiative Failure', '70% of data initiatives fail', 'Slide Pg 21'),
    (v_conference_id, 'statistic', 'FDA Warnings', '190 FDA warning letters for data integrity in FY2024', 'FDA data')
ON CONFLICT DO NOTHING;

-- Framework - North
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'framework', 'North Definition', 'North (Statistical Health): Can the data learn? Does it have the mathematical properties for ML?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'North Metrics', 'Data Sufficiency (Factor 50), Class Balance, Feature Quality (VIF), Bias Risk (Shannon entropy)', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'North Trap', 'Trap: 100% complete but 95% one class', 'Data Compass Framework')
ON CONFLICT DO NOTHING;

-- Framework - East
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'framework', 'East Definition', 'East (Semantic Clarity): Can AI reason with it? Are meanings explicit?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'East Metrics', 'FAIR Compliance, Ontology Coverage (HGNC, GO, UniProt, ChEBI), Knowledge Graph Connectivity', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'East Trap', 'Trap: KRAS with no Gene Ontology link', 'Data Compass Framework')
ON CONFLICT DO NOTHING;

-- Framework - South
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'framework', 'South Definition', 'South (Contextual Validity): Is it measuring the right thing? Data-problem fit?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'South Metrics', 'Data-Problem Fit, Proxy Variable Detection, Domain Appropriateness, Temporal Validity', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'South Trap', 'Trap: Race/ethnicity encoding healthcare access, not biology', 'Data Compass Framework')
ON CONFLICT DO NOTHING;

-- Framework - West
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'framework', 'West Definition', 'West (Governance & Safety): Can you use it safely and legally?', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'West Metrics', 'Privacy Risk (k-anonymity), ALCOA+ (21 CFR Part 11), Bias & Fairness, Licensing', 'Data Compass Framework'),
    (v_conference_id, 'framework', 'West Trap', 'Trap: Non-compliant with regulations', 'Data Compass Framework')
ON CONFLICT DO NOTHING;

-- Hashtags
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'hashtag', 'Conference', '#LabOfTheFuture #LotF2026', 'Conference branding'),
    (v_conference_id, 'hashtag', 'Product', '#DataCompass', 'Product branding'),
    (v_conference_id, 'hashtag', 'Topics', '#AIReadiness #AIReadyData #FAIRData #Ontology #MLReadiness', 'Topic tags')
ON CONFLICT DO NOTHING;

-- Speakers
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'speaker', 'Hans Clevers', 'Hans Clevers (Roche) - Rewriting rules', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Christopher Arendt', 'Christopher Arendt (Takeda)', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Nicole Crane', 'Nicole Crane (Accenture) - Tech stack vs Talent stack', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Julia Fox', 'Julia Fox (Takeda) - Semantic Tools', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Sam Michael', 'Sam Michael (GSK) - Automation', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Amrik Mahal', 'Amrik Mahal (AstraZeneca) - Lab of 2030', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Hebe Middlemiss', 'Hebe Middlemiss (AstraZeneca) - Lab of 2030', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Petrina Kamya', 'Petrina Kamya (Insilico Medicine) - Autonomous labs', 'Conference agenda'),
    (v_conference_id, 'speaker', 'Yves Fomekong Nanfack', 'Yves Fomekong Nanfack', 'Conference agenda')
ON CONFLICT DO NOTHING;

-- CTAs
INSERT INTO public.content_library (conference_id, category, label, content, source) VALUES
    (v_conference_id, 'cta', 'DM for Scorecard', 'DM me if you want to see our readiness scorecard.', 'Campaign'),
    (v_conference_id, 'cta', 'Find Us', 'Find us at the opening reception.', 'Campaign'),
    (v_conference_id, 'cta', 'Book Audit', 'Book your 15-minute Readiness Audit.', 'Campaign'),
    (v_conference_id, 'cta', 'Who is Going', 'Who is going to be in Boston?', 'Campaign')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Created content library items';

-- ============================================
-- CREATE POSTS - WEEKS 1-2 (AGITATE)
-- ============================================

-- Week 1, Tuesday - Anuj - "The $5M Mistake"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '7 days',
        'linkedin',
        'draft',
        1,
        'Tue',
        v_phase_agitate_id,
        'The $5M Mistake',
        E'We spend millions on ''Clean Data''—no duplicates, right formats. Yet 87% of AI projects fail. Why? Because Clean ≠ Ready.\n\nClean is a spreadsheet. Ready is a Compass. We need to navigate 4 dimensions, not just one.\n\nIf you''re going to #LabOfTheFuture, ask yourself: is your data ready, or just clean?',
        'Text Only',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 1, Wednesday - Nina - "The Proxy Problem"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '8 days',
        'linkedin',
        'draft',
        1,
        'Wed',
        v_phase_agitate_id,
        'The Proxy Problem',
        E'I''m prepping for #LotF2026 and thinking about Hans Clevers'' upcoming talk on rewriting rules.\n\nOne rule we must break: using demographic proxies for biology.\n\nThis is South (Contextual Validity) on the Data Compass—and it''s the most ignored direction.\n\nIf you aren''t looking South, you aren''t predicting biology; you''re predicting healthcare access.',
        'Slide: The Proxy Problem (Page 19)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 1, Thursday - Ben - "The Networking Hook"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '9 days',
        'linkedin',
        'draft',
        1,
        'Thu',
        v_phase_agitate_id,
        'The Networking Hook',
        E'Reviewing the #LotF2026 agenda. Huge lineup from Takeda and Roche.\n\nI''m looking to speak with leaders who are tired of their AI pilots stalling because they lack a navigation system for their data.\n\nWho is going to be in Boston?',
        'Photo of Conference Agenda',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 2, Tuesday - Anuj - "Asset vs. Execution"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '14 days',
        'linkedin',
        'draft',
        2,
        'Tue',
        v_phase_agitate_id,
        'Asset vs. Execution',
        E'Most failures I see happen in the top-left quadrant: High Asset Maturity (great data), Low Execution Readiness (resistant teams).\n\nWe need to measure both.\n\nExcited to discuss the full equation in Boston.',
        'Slide: Asset vs Execution Matrix (Page 28)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 2, Wednesday - Nina - "Ontology & Silos"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '15 days',
        'linkedin',
        'draft',
        2,
        'Wed',
        v_phase_agitate_id,
        'Ontology & Silos',
        E'Automation is useless if the robots don''t speak the same language.\n\nIf you''re attending Sam Michael''s (GSK) session on automation, ask: Are we building data silos at high speed?\n\nWe need East (Semantic Clarity) to fix this. #FAIRData #Ontology',
        'Slide: Ontology Management (Page 14)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 2, Thursday - Ben - "Table Stakes Rant"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '16 days',
        'linkedin',
        'draft',
        2,
        'Thu',
        v_phase_agitate_id,
        'Table Stakes Rant',
        E'Unpopular opinion: ''Data Governance'' has become a boring compliance checkbox.\n\nIt needs to be an engineering constraint. This is West (Governance) on our compass—it protects the whole journey.\n\nIf you want to see what active governance looks like, find me at #LotF.',
        'Text Only',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Created Weeks 1-2 posts';

-- ============================================
-- CREATE POSTS - WEEKS 3-4 (EDUCATE)
-- ============================================

-- Week 3, Tuesday - Anuj - "The 4 Dimensions"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '21 days',
        'linkedin',
        'draft',
        3,
        'Tue',
        v_phase_educate_id,
        'The 4 Dimensions',
        E'We need a compass for AI readiness.\n\nNorth: Statistical Health\nEast: Semantic Clarity\nSouth: Contextual Validity\nWest: Governance & Safety\n\nWhich direction is your organization ignoring? #AIReadiness',
        'Slide: 4 Dimensions Compass (Page 3)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 3, Wednesday - Nina - "Semantic Clarity"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '22 days',
        'linkedin',
        'draft',
        3,
        'Wed',
        v_phase_educate_id,
        'Semantic Clarity',
        E'Looking forward to Julia Fox''s (Takeda) talk on Semantic Tools.\n\nWe can''t have AI ''reason'' if data lacks definitions. This is East on the Compass.\n\nLevel 1 is a match. Level 3 is inference.\n\nWhere is your lab?',
        'Slide: ML-Hybrid Ontology (Page 13)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 3, Thursday - Ben - "Execution Risk"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '23 days',
        'linkedin',
        'draft',
        3,
        'Thu',
        v_phase_educate_id,
        'Execution Risk',
        E'70% of data initiatives fail. It''s usually people, not tech.\n\nI''m heading to Boston to talk about the ''Execution'' side of the equation.\n\nDM me if you want to see our readiness scorecard.',
        'Slide: 70% Failure Stat (Page 21)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 4, Tuesday - Anuj - "Soft Launch"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '28 days',
        'linkedin',
        'draft',
        4,
        'Tue',
        v_phase_educate_id,
        'Soft Launch',
        E'We''ve been working on something that automates the ''Ready'' assessment across all 4 dimensions.\n\nIt''s called Data Compass.\n\nWe''ll be demoing how it solves the Proxy Problem live in Boston. #DataCompass #Launch',
        'Image: Product Logo/Teaser',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 4, Wednesday - Nina - "Automating Fairness"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '29 days',
        'linkedin',
        'draft',
        4,
        'Wed',
        v_phase_educate_id,
        'Automating Fairness',
        E'Humans can''t check millions of rows for bias. Algorithms can.\n\nI''ll be showing how we calculate Shannon entropy for demographic representation (that''s North (Statistical Health) on the Data Compass, specifically the Bias Risk component of ML Readiness) on the fly.\n\nCatch me after Yves Fomekong Nanfack''s session.',
        'Slide: Bias Assessment Dashboard (Page 6)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 4, Thursday - Ben - "Calendar Drop"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '30 days',
        'linkedin',
        'draft',
        4,
        'Thu',
        v_phase_educate_id,
        'Calendar Drop',
        E'My calendar for Boston is filling up.\n\nI have 4 slots left for anyone who wants a 15-minute ''Readiness Audit'' of their current strategy.\n\nFirst come, first served.',
        'Calendly link',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Created Weeks 3-4 posts';

-- ============================================
-- CREATE POSTS - WEEKS 5-6 (HYPE)
-- ============================================

-- Week 5, Tuesday - Anuj - "The Challenge"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '35 days',
        'linkedin',
        'draft',
        5,
        'Tue',
        v_phase_hype_id,
        'The Challenge',
        E'I challenge every speaker at #LotF to answer one question:\n\nHow do you measure North (Statistical Health)?\n\nIs your data learning-ready, or just filled out?\n\nLooking at you Christopher Arendt and Amrik Mahal—can''t wait to hear your take!',
        'Tagged Speaker Photos',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 5, Wednesday - Nina - "Science Deep Dive"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '36 days',
        'linkedin',
        'draft',
        5,
        'Wed',
        v_phase_hype_id,
        'Science Deep Dive',
        E'I''m bringing our full ontology mapping demo to Boston.\n\nIf you want to see how we map raw instrument data to HGNC/UniProt automatically, find me.\n\nIt''s magic for data scientists.',
        'Video Snippet: Ontology Mapping',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 5, Thursday - Ben - "See You There"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '37 days',
        'linkedin',
        'draft',
        5,
        'Thu',
        v_phase_hype_id,
        'See You There',
        E'Bags are packed (almost).\n\nThe team (Anuj, Nina, and I) is bringing a new standard for AI Readiness to Boston.\n\nIf you care about ROI on your data, let''s grab coffee.',
        'Team Photo',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 6, Monday - All - "On The Ground"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '42 days',
        'linkedin',
        'draft',
        6,
        'Mon',
        v_phase_conference_id,
        'On The Ground',
        E'The Data Compass team is here in Boston!\n\nWe''re ready to move Beyond Clean. Find us at the opening reception.',
        'Selfie at Venue',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 6, Wednesday - Anuj - "Live Reaction"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '44 days',
        'linkedin',
        'draft',
        6,
        'Wed',
        v_phase_conference_id,
        'Live Reaction',
        E'Slide from Nicole Crane confirms it:\n\nTech stack and Talent stack are misaligned.\n\nThis is exactly why we built the Execution Readiness score.',
        'Photo of Keynote Slide',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Created Weeks 5-6 posts';

-- ============================================
-- CREATE POSTS - WEEK 7 (FOLLOW-UP)
-- ============================================

-- Week 7, Monday - Anuj - "The Reflection Post"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '49 days',
        'linkedin',
        'draft',
        7,
        'Mon',
        v_phase_followup_id,
        'The Reflection Post',
        E'Back from #LotF2026 and still processing.\n\nThe theme I heard in nearly every conversation: "We have the data. We have the AI tools. We don''t have confidence they''ll work together."\n\nThree things I''ll be thinking about for weeks:\n1) The gap between "clean" and "ready" is wider than most orgs realize\n2) Organizational readiness fails more projects than technical debt\n3) The industry is hungry for a standard—not another dashboard.\n\nThank you to everyone who stopped by our demo. If we connected in Boston and I owe you a follow-up—it''s coming this week. #AIReadyData #DataCompass',
        'Team photo at conference',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Monday - Nina - "The Science Standout"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '49 days',
        'linkedin',
        'draft',
        7,
        'Mon',
        v_phase_followup_id,
        'The Science Standout',
        E'The session that will stick with me from #LotF2026: Julia Fox''s talk on Semantic Tools for Drug Discovery.\n\nShe articulated something I''ve been saying for years: you can''t build AI that "reasons" if your data doesn''t have definitions.\n\nThis is East on the Data Compass—Semantic Clarity. Most orgs treat ontology mapping as a nice-to-have. It''s actually the difference between AI that correlates and AI that understands.\n\nIf you''re working on semantic infrastructure for life sciences data, I''d love to connect. #FAIRData #Ontology #LotF2026',
        'Julia Fox session photo or Ontology slide (Page 13-14)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Monday - Ben - "Connector Gratitude"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '49 days',
        'linkedin',
        'draft',
        7,
        'Mon',
        v_phase_followup_id,
        'Connector Gratitude',
        E'31 conversations. 14 demo requests. 1 incredible week.\n\nThank you to everyone who made time for us at #LotF2026.\n\nWhat struck me most: the hunger for a clear answer to "is our data actually AI-ready?" Not "is it clean?" Not "is it cataloged?" But: "Can we confidently build on this?"\n\nIf we spoke in Boston and you want that 15-minute Readiness Audit we discussed—my calendar is open. Link in comments.\n\nTo the Data Compass team (Anuj, Nina)—proud to build this with you. #DataCompass #AIReadyData',
        'Networking collage or booth photo',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Wednesday - Anuj - "Insight Thread"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '51 days',
        'linkedin',
        'draft',
        7,
        'Wed',
        v_phase_followup_id,
        'Insight Thread (5 Learnings)',
        E'5 things I learned at #LotF2026:\n\n1) The "Tech Stack vs Talent Stack" gap is real (Nicole Crane nailed it)\n2) Autonomous labs need autonomous quality control (Petrina Kamya''s vision)\n3) CMC is the next frontier for AI readiness\n4) Semantic interoperability is non-negotiable\n5) The industry wants a standard, not another tool.\n\nWe''re listening. More to share soon. What was your biggest takeaway? #LotF2026',
        '5 Learnings graphic',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Wednesday - Nina - "Technical Deep Dive"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '51 days',
        'linkedin',
        'draft',
        7,
        'Wed',
        v_phase_followup_id,
        'Technical Deep Dive',
        E'At #LotF2026, I got the question I was hoping for: "How do you actually measure if data is ML-ready? What''s the math?"\n\nShort version:\n- Data Sufficiency (Factor 50 Rule, power analysis, class balance)\n- Bias Risk (Shannon entropy, CDD divergence, proxy detection)\n- Feature Quality (Theil''s U, R-value, VIF)\n\nThis isn''t a black box. It''s peer-reviewed methodology (AIDRIN framework, SSDBM 2024).\n\nDM me for the full technical breakdown. #MLReadiness #DataScience #AIReadyData',
        'Slide 40 (ML Readiness Assessment)',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Wednesday - Ben - "Pipeline Post"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '51 days',
        'linkedin',
        'draft',
        7,
        'Wed',
        v_phase_followup_id,
        'Pipeline Post',
        E'Post-conference reality check:\n\nWe came to #LotF2026 with a hypothesis: "Leaders know they have a data readiness problem but don''t have a way to measure it."\n\nValidated.\n\nNow scheduling deep-dive sessions with teams from:\n- 3 top-10 pharma companies\n- 2 AI-native drug discovery platforms\n- 1 major CRO\n\nIf your organization is tired of AI pilots that stall at the data stage, we should talk.\n\nComplimentary "Readiness Audits" through end of Q1. One dataset. Four dimensions. Full assessment. #DataCompass #AIReadyData',
        'Complimentary Readiness Audit graphic',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Friday - Anuj - "Challenge Recap"
IF v_anuj_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_anuj_id,
        CURRENT_DATE + INTERVAL '53 days',
        'linkedin',
        'draft',
        7,
        'Fri',
        v_phase_followup_id,
        'Challenge Recap',
        E'Before #LotF2026, I challenged speakers to answer: "How do you measure Statistical Health (North)?"\n\nHere''s what I heard:\n- Some orgs measure it manually, per project, without standardization\n- Many measure Data Quality but NOT ML Readiness\n- Almost no one has a portfolio-level view\n\nThe gap is clear. The opportunity is massive.\n\nTo Christopher Arendt, Amrik Mahal, and everyone who engaged: thank you. Your answers are shaping our roadmap. #LotF2026 #DataCompass #AIReadyData',
        'Challenge question graphic',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Friday - Nina - "Community Builder"
IF v_nina_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_nina_id,
        CURRENT_DATE + INTERVAL '53 days',
        'linkedin',
        'draft',
        7,
        'Fri',
        v_phase_followup_id,
        'Community Builder',
        E'One of the best parts of #LotF2026: finding my people.\n\nData scientists and informaticians who care about:\n- FAIR principles beyond checkboxes\n- Ontology infrastructure that actually works\n- Bias detection before it becomes a regulatory problem\n- Making AI trustworthy not just powerful\n\nI''m starting a monthly "AI Readiness" virtual coffee chat.\nFirst session: February.\nTopic: "Measuring Semantic Interoperability—What Works and What Doesn''t."\n\nComment "interested" if you want an invite. #FAIRData #DataScience #AIReadyData',
        'AI Readiness Coffee Chat graphic',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

-- Week 7, Friday - Ben - "CTA Close"
IF v_ben_id IS NOT NULL THEN
    INSERT INTO public.posts (conference_id, author_id, scheduled_date, platform, status, week_number, day_of_week, phase_id, theme, content, visual_asset, cross_pollination_required)
    VALUES (
        v_conference_id,
        v_ben_id,
        CURRENT_DATE + INTERVAL '53 days',
        'linkedin',
        'draft',
        7,
        'Fri',
        v_phase_followup_id,
        'CTA Close',
        E'Last call from #LotF2026:\n\nIf we spoke in Boston and you''re still deciding whether to book that demo—here''s what you''ll see:\n- A real assessment of YOUR data (not canned demo)\n- Scores across all 4 dimensions\n- Prioritized recommendations with effort estimates\n- Audit-ready documentation\n\nTime: 30 minutes.\nOutcome: You''ll know exactly where your AI readiness gaps are.\n\nNo pitch. No pressure. Just clarity.\n\nBook here: [Calendly Link]\n\nThanks again, Boston. Until next time. #DataCompass #AIReadyData #LotF2026',
        'Product dashboard screenshot',
        TRUE
    )
    ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Created Week 7 posts';

RAISE NOTICE 'LOTF 2026 campaign seed data complete!';
RAISE NOTICE 'Conference ID: %', v_conference_id;
RAISE NOTICE 'Created 5 phases, 3 personas, ~25 content library items, ~20 posts';

END $$;
