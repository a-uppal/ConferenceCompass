-- Fix Team Personas and Post Authors v2
-- Creates real auth users for Nina and Ben, then sets up personas and posts

-- First, enable the pgcrypto extension if not already enabled
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
-- CREATE AUTH USERS FOR NINA AND BEN
-- ============================================

-- Check if Nina exists, if not create her
SELECT id INTO v_nina_id FROM auth.users WHERE email = v_nina_email;

IF v_nina_id IS NULL THEN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_nina_email,
        crypt(v_nina_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Nina Krause"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_nina_id;

    RAISE NOTICE 'Created auth user for Nina: %', v_nina_id;
ELSE
    RAISE NOTICE 'Nina auth user already exists: %', v_nina_id;
END IF;

-- Check if Ben exists, if not create him
SELECT id INTO v_ben_id FROM auth.users WHERE email = v_ben_email;

IF v_ben_id IS NULL THEN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_ben_email,
        crypt(v_ben_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Ben Figueroa"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_ben_id;

    RAISE NOTICE 'Created auth user for Ben: %', v_ben_id;
ELSE
    RAISE NOTICE 'Ben auth user already exists: %', v_ben_id;
END IF;

-- ============================================
-- CREATE PUBLIC USER PROFILES
-- ============================================

-- Create Nina's public profile
INSERT INTO public.users (id, email, full_name)
VALUES (v_nina_id, v_nina_email, 'Nina Krause')
ON CONFLICT (id) DO UPDATE SET full_name = 'Nina Krause', email = v_nina_email;

-- Create Ben's public profile
INSERT INTO public.users (id, email, full_name)
VALUES (v_ben_id, v_ben_email, 'Ben Figueroa')
ON CONFLICT (id) DO UPDATE SET full_name = 'Ben Figueroa', email = v_ben_email;

RAISE NOTICE 'Created/updated public profiles for Nina and Ben';

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
-- Rotation: Week 1,3,5: Anuj(Tue), Nina(Wed), Ben(Thu)
--           Week 2,4,6: Ben(Tue), Anuj(Wed), Nina(Thu)
-- ============================================

-- Reset all to Anuj first
UPDATE public.posts SET author_id = v_anuj_id WHERE conference_id = v_conference_id;

-- Week 1, 3, 5 pattern
UPDATE public.posts SET author_id = v_nina_id
WHERE conference_id = v_conference_id
AND week_number IN (1, 3, 5) AND day_of_week = 'Wed';

UPDATE public.posts SET author_id = v_ben_id
WHERE conference_id = v_conference_id
AND week_number IN (1, 3, 5) AND day_of_week = 'Thu';

-- Week 2, 4, 6 pattern
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
SELECT 'POSTS BY AUTHOR' as section;
SELECT
    u.full_name as author,
    COUNT(*) as post_count
FROM public.posts p
JOIN public.users u ON p.author_id = u.id
JOIN public.conferences c ON p.conference_id = c.id
WHERE c.name ILIKE '%LOTF%'
GROUP BY u.full_name
ORDER BY post_count DESC;

SELECT 'TEAM PERSONAS' as section;
SELECT
    u.full_name,
    tp.persona_name,
    tp.lane,
    tp.tone
FROM public.team_personas tp
JOIN public.users u ON tp.user_id = u.id
JOIN public.conferences c ON tp.conference_id = c.id
WHERE c.name ILIKE '%LOTF%';
