-- Fix Team Personas and Post Authors
-- Script: fix-personas-and-authors.sql
-- This creates Nina and Ben profiles, adds all 3 personas, and reassigns posts

DO $$
DECLARE
    v_conference_id UUID;
    v_team_id UUID;
    v_anuj_id UUID;
    v_nina_id UUID := '11111111-1111-1111-1111-111111111111';
    v_ben_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN

-- Get LOTF 2026 conference
SELECT id INTO v_conference_id
FROM public.conferences
WHERE name ILIKE '%LOTF%'
LIMIT 1;

IF v_conference_id IS NULL THEN
    RAISE EXCEPTION 'LOTF conference not found.';
END IF;

-- Get team_id from conference
SELECT team_id INTO v_team_id
FROM public.conferences
WHERE id = v_conference_id;

RAISE NOTICE 'Conference: %, Team: %', v_conference_id, v_team_id;

-- Get Anuj's user ID
SELECT id INTO v_anuj_id
FROM public.users
WHERE full_name ILIKE '%Anuj%'
LIMIT 1;

RAISE NOTICE 'Anuj ID: %', v_anuj_id;

-- ============================================
-- CREATE NINA AND BEN USER PROFILES
-- ============================================
-- Note: These are "virtual" users for display purposes
-- They use fixed UUIDs so we can reference them

-- Delete if exist (to allow re-running)
DELETE FROM public.team_members WHERE user_id IN (v_nina_id, v_ben_id);
DELETE FROM public.users WHERE id IN (v_nina_id, v_ben_id);

-- Create Nina (PhD Scientist)
INSERT INTO public.users (id, email, full_name, avatar_url)
VALUES (v_nina_id, 'nina@datacompass.ai', 'Nina Chen', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = 'Nina Chen';

-- Create Ben (VP Sales)
INSERT INTO public.users (id, email, full_name, avatar_url)
VALUES (v_ben_id, 'ben@datacompass.ai', 'Ben Martinez', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = 'Ben Martinez';

RAISE NOTICE 'Created Nina and Ben user profiles';

-- ============================================
-- ADD THEM TO THE TEAM
-- ============================================
INSERT INTO public.team_members (team_id, user_id, role)
VALUES
    (v_team_id, v_nina_id, 'member'),
    (v_team_id, v_ben_id, 'member')
ON CONFLICT (team_id, user_id) DO NOTHING;

RAISE NOTICE 'Added Nina and Ben to team';

-- ============================================
-- CREATE ALL THREE TEAM PERSONAS
-- ============================================
DELETE FROM public.team_personas WHERE conference_id = v_conference_id;

-- Anuj - The Visionary Architect
INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
VALUES (
    v_conference_id,
    v_anuj_id,
    'The Visionary Architect',
    'Strategy, Organizational Risk, "The System is Broken"',
    'Authoritative, challenging',
    ARRAY['Asset Maturity vs. Execution Risk (Pg 28)']
);

-- Nina - The Credible Expert
INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
VALUES (
    v_conference_id,
    v_nina_id,
    'The Credible Expert',
    'Methodology, Evidence, "The How"',
    'Peer-to-peer, technical, specific',
    ARRAY['Proxy Problem (Pg 19)', 'Ontology (Pg 12)']
);

-- Ben - The Connector
INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides)
VALUES (
    v_conference_id,
    v_ben_id,
    'The Connector',
    'Business Value, ROI, Networking',
    'Energetic, solution-oriented',
    ARRAY['70% Failure Rate (Pg 21)']
);

RAISE NOTICE 'Created all 3 team personas';

-- ============================================
-- REASSIGN POSTS TO CORRECT AUTHORS
-- Based on content themes matching their lanes
-- ============================================

-- Posts that should be Nina's (technical/methodology/evidence themes)
UPDATE public.posts
SET author_id = v_nina_id
WHERE conference_id = v_conference_id
AND (
    theme ILIKE '%Proxy%'
    OR theme ILIKE '%Ontology%'
    OR theme ILIKE '%Semantic%'
    OR theme ILIKE '%Statistical%'
    OR theme ILIKE '%4 Dimensions%'
    OR theme ILIKE '%methodology%'
    OR theme ILIKE '%Technical%'
    OR content ILIKE '%methodology%'
    OR content ILIKE '%Level 1%Level 3%'
    OR content ILIKE '%inference%'
);

-- Posts that should be Ben's (networking/business value/ROI themes)
UPDATE public.posts
SET author_id = v_ben_id
WHERE conference_id = v_conference_id
AND (
    theme ILIKE '%Network%'
    OR theme ILIKE '%ROI%'
    OR theme ILIKE '%Business%'
    OR theme ILIKE '%70%%'
    OR theme ILIKE '%Failure%'
    OR theme ILIKE '%Connection%'
    OR theme ILIKE '%Who is Going%'
    OR content ILIKE '%Who is going%'
    OR content ILIKE '%find me%'
    OR content ILIKE '%schedule%demo%'
    OR content ILIKE '%70%%fail%'
);

-- Anuj keeps strategy/vision posts (the rest)
-- No update needed as they're already assigned to Anuj

-- For a more balanced distribution, let's also rotate some posts
-- Week 1: Anuj(Tue), Nina(Wed), Ben(Thu)
-- Week 2: Ben(Tue), Anuj(Wed), Nina(Thu)
-- etc.

-- More specific reassignments based on typical rotation
UPDATE public.posts SET author_id = v_nina_id
WHERE conference_id = v_conference_id
AND week_number IN (1, 3, 5) AND day_of_week = 'Wed';

UPDATE public.posts SET author_id = v_ben_id
WHERE conference_id = v_conference_id
AND week_number IN (1, 3, 5) AND day_of_week = 'Thu';

UPDATE public.posts SET author_id = v_ben_id
WHERE conference_id = v_conference_id
AND week_number IN (2, 4, 6) AND day_of_week = 'Tue';

UPDATE public.posts SET author_id = v_nina_id
WHERE conference_id = v_conference_id
AND week_number IN (2, 4, 6) AND day_of_week = 'Thu';

RAISE NOTICE 'Reassigned posts to team members';

-- ============================================
-- VERIFICATION
-- ============================================
RAISE NOTICE '=== VERIFICATION ===';
RAISE NOTICE 'Posts by Anuj: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_anuj_id);
RAISE NOTICE 'Posts by Nina: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_nina_id);
RAISE NOTICE 'Posts by Ben: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_ben_id);
RAISE NOTICE 'Total Personas: %', (SELECT COUNT(*) FROM public.team_personas WHERE conference_id = v_conference_id);

END $$;

-- Show results
SELECT
    u.full_name as author,
    COUNT(*) as post_count
FROM public.posts p
JOIN public.users u ON p.author_id = u.id
JOIN public.conferences c ON p.conference_id = c.id
WHERE c.name ILIKE '%LOTF%'
GROUP BY u.full_name
ORDER BY post_count DESC;

SELECT
    u.full_name,
    tp.persona_name,
    tp.lane,
    tp.tone
FROM public.team_personas tp
JOIN public.users u ON tp.user_id = u.id
JOIN public.conferences c ON tp.conference_id = c.id
WHERE c.name ILIKE '%LOTF%';
