-- Fix Team Personas and Post Authors v3
-- Creates real auth users for Nina and Ben, assigns posts based on exact CSV data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_conference_id UUID;
    v_team_id UUID;
    v_anuj_id UUID;
    v_nina_id UUID;
    v_ben_id UUID;
    v_nina_email TEXT := 'Nina.Krause@campana-schott.com';
    v_ben_email TEXT := 'Benjamin.Figueroa@campana-schott.com';
    v_nina_password TEXT := 'NKrause123';
    v_ben_password TEXT := 'BFigueroa123';
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
SELECT team_id INTO v_team_id FROM public.conferences WHERE id = v_conference_id;

RAISE NOTICE 'Conference: %, Team: %', v_conference_id, v_team_id;

-- Get Anuj's user ID
SELECT id INTO v_anuj_id FROM public.users WHERE full_name ILIKE '%Anuj%' LIMIT 1;
RAISE NOTICE 'Anuj ID: %', v_anuj_id;

-- ============================================
-- CREATE AUTH USERS FOR NINA AND BEN
-- ============================================

-- Check if Nina exists
SELECT id INTO v_nina_id FROM auth.users WHERE email = v_nina_email;

IF v_nina_id IS NULL THEN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        v_nina_email, crypt(v_nina_password, gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Nina Krause"}'::jsonb,
        NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO v_nina_id;
    RAISE NOTICE 'Created auth user for Nina: %', v_nina_id;
ELSE
    RAISE NOTICE 'Nina already exists: %', v_nina_id;
END IF;

-- Check if Ben exists
SELECT id INTO v_ben_id FROM auth.users WHERE email = v_ben_email;

IF v_ben_id IS NULL THEN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        v_ben_email, crypt(v_ben_password, gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Ben Figueroa"}'::jsonb,
        NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO v_ben_id;
    RAISE NOTICE 'Created auth user for Ben: %', v_ben_id;
ELSE
    RAISE NOTICE 'Ben already exists: %', v_ben_id;
END IF;

-- ============================================
-- CREATE PUBLIC USER PROFILES
-- ============================================
INSERT INTO public.users (id, email, full_name)
VALUES (v_nina_id, v_nina_email, 'Nina Krause')
ON CONFLICT (id) DO UPDATE SET full_name = 'Nina Krause', email = v_nina_email;

INSERT INTO public.users (id, email, full_name)
VALUES (v_ben_id, v_ben_email, 'Ben Figueroa')
ON CONFLICT (id) DO UPDATE SET full_name = 'Ben Figueroa', email = v_ben_email;

RAISE NOTICE 'Created public profiles';

-- ============================================
-- ADD THEM TO THE TEAM
-- ============================================
INSERT INTO public.team_members (team_id, user_id, role)
VALUES (v_team_id, v_nina_id, 'member'), (v_team_id, v_ben_id, 'member')
ON CONFLICT (team_id, user_id) DO NOTHING;

RAISE NOTICE 'Added to team';

-- ============================================
-- CREATE ALL THREE TEAM PERSONAS
-- ============================================
DELETE FROM public.team_personas WHERE conference_id = v_conference_id;

INSERT INTO public.team_personas (conference_id, user_id, persona_name, lane, tone, key_slides) VALUES
(v_conference_id, v_anuj_id, 'The Visionary Architect',
 'Strategy, Organizational Risk, "The System is Broken"', 'Authoritative, challenging',
 ARRAY['Asset Maturity vs. Execution Risk (Pg 28)']),
(v_conference_id, v_nina_id, 'The Credible Expert',
 'Methodology, Evidence, "The How"', 'Peer-to-peer, technical, specific',
 ARRAY['Proxy Problem (Pg 19)', 'Ontology (Pg 12)']),
(v_conference_id, v_ben_id, 'The Connector',
 'Business Value, ROI, Networking', 'Energetic, solution-oriented',
 ARRAY['70% Failure Rate (Pg 21)']);

RAISE NOTICE 'Created 3 personas';

-- ============================================
-- ASSIGN POSTS TO CORRECT AUTHORS (from CSV)
-- ============================================

-- First, reset all posts to Anuj (default)
UPDATE public.posts SET author_id = v_anuj_id WHERE conference_id = v_conference_id;

-- NINA's Posts (from Nina_Posts.csv):
-- W1: Proxy Problem, W2: Ontology & Silos, W3: Semantic Clarity
-- W4: Automating Fairness, W5: Science Deep Dive
-- W7: The Science Standout, Technical Deep Dive, Community Builder
UPDATE public.posts SET author_id = v_nina_id
WHERE conference_id = v_conference_id
AND (
    theme ILIKE '%Proxy Problem%'
    OR theme ILIKE '%Proxy%'
    OR theme ILIKE '%Ontology%'
    OR theme ILIKE '%Semantic Clarity%'
    OR theme ILIKE '%Automating Fairness%'
    OR theme ILIKE '%Science Deep Dive%'
    OR theme ILIKE '%Science Standout%'
    OR theme ILIKE '%Technical Deep Dive%'
    OR theme ILIKE '%Community Builder%'
);

-- BEN's Posts (from Ben_Posts.csv):
-- W1: Networking Hook, W2: Table Stakes Rant, W3: Execution Risk
-- W4: Calendar Drop, W5: See You There
-- W7: Connector Gratitude, Pipeline Post, CTA Close
UPDATE public.posts SET author_id = v_ben_id
WHERE conference_id = v_conference_id
AND (
    theme ILIKE '%Networking Hook%'
    OR theme ILIKE '%Networking%'
    OR theme ILIKE '%Table Stakes%'
    OR theme ILIKE '%Execution Risk%'
    OR theme ILIKE '%Calendar Drop%'
    OR theme ILIKE '%See You There%'
    OR theme ILIKE '%Connector Gratitude%'
    OR theme ILIKE '%Pipeline Post%'
    OR theme ILIKE '%CTA Close%'
);

-- ANUJ keeps (from Anuj_Posts.csv):
-- W1: The $5M Mistake, W2: Asset vs Execution, W3: The 4 Dimensions
-- W4: Soft Launch, W5: Speaker Challenge, W6: Live Reaction
-- W7: The Reflection Post, Insight Thread, Challenge Recap
-- (These are already assigned to Anuj by default)

RAISE NOTICE 'Assigned posts to correct authors';

-- ============================================
-- VERIFICATION
-- ============================================
RAISE NOTICE '=== VERIFICATION ===';
RAISE NOTICE 'Anuj posts: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_anuj_id);
RAISE NOTICE 'Nina posts: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_nina_id);
RAISE NOTICE 'Ben posts: %', (SELECT COUNT(*) FROM public.posts WHERE conference_id = v_conference_id AND author_id = v_ben_id);
RAISE NOTICE 'Total personas: %', (SELECT COUNT(*) FROM public.team_personas WHERE conference_id = v_conference_id);

END $$;

-- Show final results
SELECT '=== POSTS BY AUTHOR ===' as info;
SELECT u.full_name as author, COUNT(*) as post_count
FROM public.posts p
JOIN public.users u ON p.author_id = u.id
JOIN public.conferences c ON p.conference_id = c.id
WHERE c.name ILIKE '%LOTF%'
GROUP BY u.full_name
ORDER BY u.full_name;

SELECT '=== POST DETAILS ===' as info;
SELECT u.full_name as author, p.week_number as week, p.theme
FROM public.posts p
JOIN public.users u ON p.author_id = u.id
JOIN public.conferences c ON p.conference_id = c.id
WHERE c.name ILIKE '%LOTF%'
ORDER BY p.week_number, u.full_name;

SELECT '=== TEAM PERSONAS ===' as info;
SELECT u.full_name, tp.persona_name, tp.lane
FROM public.team_personas tp
JOIN public.users u ON tp.user_id = u.id
WHERE tp.conference_id = (SELECT id FROM public.conferences WHERE name ILIKE '%LOTF%' LIMIT 1);
