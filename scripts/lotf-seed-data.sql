-- LOTF 2026 Seed Data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lowksjkxxudgywbptnrf/sql

-- First, get your user ID from auth.users after signing up
-- Replace 'YOUR_USER_ID' with your actual user ID

-- Step 1: Create user profile (replace email and ID with yours)
DO $$
DECLARE
    v_user_id UUID;
    v_team_id UUID;
    v_conf_id UUID;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please sign up first in the app.';
    END IF;

    -- Create user profile if not exists
    INSERT INTO public.users (id, email, full_name)
    SELECT v_user_id, email, COALESCE(raw_user_meta_data->>'full_name', 'Conference Attendee')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;

    -- Create team
    INSERT INTO public.teams (name, description, created_by)
    VALUES ('Data Compass Team', 'Our conference value capture team', v_user_id)
    RETURNING id INTO v_team_id;

    -- Add user as team owner
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, v_user_id, 'owner');

    -- Create LOTF 2026 Conference
    INSERT INTO public.conferences (team_id, name, location, start_date, end_date, description)
    VALUES (
        v_team_id,
        'Leaders of the Future (LOTF) 2026',
        'Boston, MA',
        '2026-03-10',
        '2026-03-11',
        'The premier conference for pharma R&D digital transformation, lab automation, and AI innovation.'
    )
    RETURNING id INTO v_conf_id;

    -- Insert all sessions
    INSERT INTO public.sessions (conference_id, title, description, speaker_name, speaker_company, start_time, end_time, location, track) VALUES
    -- Keynote Morning
    (v_conf_id, 'Moderator''s Introduction and Overview', 'VP Research, Pre-clinical and Manufacturing, Data, Technology & Engineering', 'Julie Huxley-Jones', 'Vertex Pharmaceuticals', '2026-03-10 08:40:00-05', '2026-03-10 08:50:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Data, Biology, and Technology: Rewriting the Rules of Drug Discovery and Development', 'Head of Pharma Research and Early Development', 'Hans Clevers', 'Roche', '2026-03-10 08:50:00-05', '2026-03-10 09:05:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Are Your Tech Stack and Talent Stack Aligned?', 'Senior Principal', 'Nicole Crane', 'Accenture', '2026-03-10 09:05:00-05', '2026-03-10 09:20:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Building the Foundation for Labs of Tomorrow: Where Strategy Meets Skills, Systems and Science', 'CSO, Head of Research', 'Christopher Arendt', 'Takeda', '2026-03-10 09:20:00-05', '2026-03-10 09:35:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Creating a Data Ecosystem That Enables the Lab of the Future', 'VP & GM of Digital Lab Solutions', 'Mark Fish', 'Thermo Fisher Scientific', '2026-03-10 09:35:00-05', '2026-03-10 09:50:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Panel Discussion and Q&A - Opening Keynotes', 'Panel with Julie Huxley-Jones, Hans Clevers, Christopher Arendt, Nicole Crane, Mark Fish', 'Multiple Speakers', 'Various', '2026-03-10 09:50:00-05', '2026-03-10 10:15:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Coffee Break and Networking Session', 'Network with fellow attendees', NULL, NULL, '2026-03-10 10:15:00-05', '2026-03-10 11:00:00-05', 'Exhibition Room', 'Networking'),

    -- Mid-Morning Keynotes
    (v_conf_id, 'Continued Evolution of "Wet" Lab Research: Lights Out, Self-driving and Human Augmentation?', 'Vice President, Cross Modalities Workflows', 'James Love', 'Novo Nordisk', '2026-03-10 11:00:00-05', '2026-03-10 11:30:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Utilising Data automation and Automotive Tools to Support Biopharma R&D', 'VP, Data, Automation & Predictive Sciences', 'Sam Michael', 'GSK', '2026-03-10 11:30:00-05', '2026-03-10 12:00:00-05', 'Main Hall', 'Keynote'),
    (v_conf_id, 'Panel Discussion - Wet Lab Evolution', 'Panel with Sam Michael and James Love', 'Sam Michael, James Love', 'GSK, Novo Nordisk', '2026-03-10 12:00:00-05', '2026-03-10 12:20:00-05', 'Main Hall', 'Keynote'),

    -- Parallel Track - Data & AI
    (v_conf_id, 'Lab of 2030: Capturing Data at Source, Intelligent Orchestration and AI Driven Innovation', 'Global Head of IT for Research / Senior Director, AI Strategy and Innovation', 'Amrik Mahal, Hebe Middlemiss', 'AstraZeneca', '2026-03-10 11:00:00-05', '2026-03-10 11:30:00-05', 'Track A Room', 'Data & AI'),
    (v_conf_id, 'From Experiments to Enterprise: Orchestrating Data for the Lab of the Future', 'Lead Product Manager, Process Development', 'Marc Smith', 'IDBS', '2026-03-10 11:00:00-05', '2026-03-10 11:30:00-05', 'Track A Room', 'Data & AI'),
    (v_conf_id, 'Creating a Data Ecosystem That Enables the Lab of the Future', 'Head of Computational Science, Data Strategy & Senior R&D Leadership Team', 'Hans Bitter', 'Takeda', '2026-03-10 11:30:00-05', '2026-03-10 12:00:00-05', 'Track A Room', 'Data & AI'),
    (v_conf_id, 'Panel Discussion - Data Ecosystem', 'Panel with Mark Borowsky, Amrik Mahal, Hebe Middlemiss, Hans Bitter, Marc Smith', 'Multiple Speakers', 'Various', '2026-03-10 12:00:00-05', '2026-03-10 12:20:00-05', 'Track A Room', 'Data & AI'),

    (v_conf_id, 'Congress Lunch and Networking', 'Lunch and networking in the Exhibition Room', NULL, NULL, '2026-03-10 12:20:00-05', '2026-03-10 13:20:00-05', 'Exhibition Room', 'Networking'),

    -- Afternoon - AI to Innovate
    (v_conf_id, 'Driving the Next Frontier of AI-powered Drug Discovery', 'Head of AI/ML Research', 'Yves Fomekong Nanfack', 'Takeda', '2026-03-10 13:20:00-05', '2026-03-10 13:35:00-05', 'AI Room', 'AI to Innovate'),
    (v_conf_id, 'Enabling Scientists Through Digital Innovation and In-Silico Modeling', 'Head of Digital In-Silico Research', 'Ilan Wapinski', 'Sanofi', '2026-03-10 13:35:00-05', '2026-03-10 14:05:00-05', 'AI Room', 'AI to Innovate'),
    (v_conf_id, 'Panel Discussion - AI Drug Discovery', 'Panel with Thrasyvoulos Karydis, Yves Fomekong Nanfack, Ilan Wapinski', 'Multiple Speakers', 'DeepCure, Takeda, Sanofi', '2026-03-10 14:05:00-05', '2026-03-10 14:20:00-05', 'AI Room', 'AI to Innovate'),

    -- Afternoon - Automated Lab
    (v_conf_id, 'Lab Automation at Boston Seaport Innovation Centre', 'Genetic Medicine Lab Automation Lead', 'Jesse Mulcahy', 'Eli Lilly and Company', '2026-03-10 13:20:00-05', '2026-03-10 13:35:00-05', 'Automation Room', 'Automated Lab'),
    (v_conf_id, 'Humanoids and Fully Autonomous Labs', 'VP, Global Head of AI Platforms', 'Petrina Kamya', 'Insilico Medicine', '2026-03-10 13:35:00-05', '2026-03-10 14:05:00-05', 'Automation Room', 'Automated Lab'),
    (v_conf_id, 'Panel Discussion - Lab Automation', 'Panel with Jesse Mulcahy and Petrina Kamya', 'Jesse Mulcahy, Petrina Kamya', 'Eli Lilly, Insilico Medicine', '2026-03-10 14:05:00-05', '2026-03-10 14:20:00-05', 'Automation Room', 'Automated Lab'),

    -- Afternoon - Digital Transformation
    (v_conf_id, 'Pfizer Use Case: Leveraging Agentic AI in Practice', 'Director, Digital Strategy', 'Pamela Sepulveda', 'Pfizer', '2026-03-10 13:20:00-05', '2026-03-10 13:35:00-05', 'Digital Room', 'Digital Transformation'),
    (v_conf_id, 'Pfizer Use Case 2: Harnessing Emerging Technologies in R&D', 'Director, Digital Strategy', 'Pamela Sepulveda', 'Pfizer', '2026-03-10 13:35:00-05', '2026-03-10 14:05:00-05', 'Digital Room', 'Digital Transformation'),
    (v_conf_id, 'Panel Discussion - Digital Transformation', 'Panel Discussion', 'Pamela Sepulveda', 'Pfizer', '2026-03-10 14:05:00-05', '2026-03-10 14:20:00-05', 'Digital Room', 'Digital Transformation'),

    -- Mid-Afternoon - AI to Innovate
    (v_conf_id, 'Scaling AI in R&D Through Foundation Models and Agentic Frameworks', 'Chief AI and Data Scientist, Oncology R&D', 'Jorge Reis-Filho', 'AstraZeneca', '2026-03-10 14:20:00-05', '2026-03-10 14:35:00-05', 'AI Room', 'AI to Innovate'),
    (v_conf_id, 'Unlocking Protein Insights Through Seamless Access to AI Models at Scale', 'Senior Engineer, Technology II', 'Michail Vlysidis', 'AbbVie', '2026-03-10 14:35:00-05', '2026-03-10 15:05:00-05', 'AI Room', 'AI to Innovate'),
    (v_conf_id, 'Panel Discussion - Scaling AI', 'Panel with Mohit Goel, Jorge Reis-Filho, Michail Vlysidis', 'Multiple Speakers', 'Moderna, AstraZeneca, AbbVie', '2026-03-10 15:05:00-05', '2026-03-10 15:20:00-05', 'AI Room', 'AI to Innovate'),

    -- Mid-Afternoon - Automated Lab
    (v_conf_id, 'The Automated Lab Rollercoaster: Integrating Emerging Technologies Across DMPK', 'Senior Director of World Wide Discovery DMPK and Sample Management', 'Michael Reilly', 'GSK', '2026-03-10 14:20:00-05', '2026-03-10 14:35:00-05', 'Automation Room', 'Automated Lab'),
    (v_conf_id, 'Intelligent Automation in Biologics Development', 'Senior Director - Digital & Automation, Cell & Gene Therapy', 'Kristina Lopez, Nicole Medeiros', 'J&J Innovative Medicine', '2026-03-10 14:35:00-05', '2026-03-10 15:05:00-05', 'Automation Room', 'Automated Lab'),
    (v_conf_id, 'Panel Discussion - Automation Integration', 'Panel with Mike Berke, Michael Reilly, Kristina Lopez, Nicole Medeiros', 'Multiple Speakers', 'Amgen, GSK, J&J', '2026-03-10 15:05:00-05', '2026-03-10 15:20:00-05', 'Automation Room', 'Automated Lab'),

    -- Mid-Afternoon - Digital Transformation
    (v_conf_id, 'In-Silico CMC: Accelerating Digital Drug Development', 'Senior Director, Digital R&D Product Line Owner, In Silico CMC', 'Denise Teotico', 'Sanofi', '2026-03-10 14:20:00-05', '2026-03-10 14:35:00-05', 'Digital Room', 'Digital Transformation'),
    (v_conf_id, 'Building the Digital Ecosystem for the Lab of the Future', 'Director, Data and Solutions Engineering', 'Nevin Gerek Ince', 'Novo Nordisk', '2026-03-10 14:35:00-05', '2026-03-10 15:05:00-05', 'Digital Room', 'Digital Transformation'),
    (v_conf_id, 'Panel Discussion - Digital Ecosystem', 'Panel with Nevin Gerek Ince and Denise Teotico', 'Nevin Gerek Ince, Denise Teotico', 'Novo Nordisk, Sanofi', '2026-03-10 15:05:00-05', '2026-03-10 15:20:00-05', 'Digital Room', 'Digital Transformation'),

    (v_conf_id, 'Afternoon Tea and Networking', 'Tea break and networking', NULL, NULL, '2026-03-10 15:20:00-05', '2026-03-10 16:05:00-05', 'Exhibition Room', 'Networking'),

    -- Late Afternoon - AI to Disrupt
    (v_conf_id, 'Speeding the Clock of Research at BMS – Systems Integration and Automation Case Study', 'Director, R&D IT, Instrument Operations & Data Management', 'Martina Miteva', 'Bristol Myers Squibb', '2026-03-10 16:05:00-05', '2026-03-10 16:20:00-05', 'Main Hall', 'AI to Disrupt'),
    (v_conf_id, 'Speeding the Clock of Research at BMS – Using Technology to Advance our Science', 'Director, R&D IT, Prediction & Insights', 'David Liu', 'Bristol Myers Squibb', '2026-03-10 16:20:00-05', '2026-03-10 16:50:00-05', 'Main Hall', 'AI to Disrupt'),
    (v_conf_id, 'Panel Discussion - BMS Case Study', 'Panel with Al Wang, Martina Miteva, David Liu', 'Al Wang, Martina Miteva, David Liu', 'Bristol Myers Squibb', '2026-03-10 16:50:00-05', '2026-03-10 17:05:00-05', 'Main Hall', 'AI to Disrupt'),

    -- Late Afternoon - Connected Lab
    (v_conf_id, 'Uniting LIMS, ELN, Reagent Management and Analytical Systems for E2E Digital Continuity', 'Principal Platform Manager', 'Vimaldev Devaraja', 'Johnson and Johnson Innovative Medicine', '2026-03-10 16:05:00-05', '2026-03-10 16:20:00-05', 'Connected Lab Room', 'Connected Lab'),
    (v_conf_id, 'Lab-in-a-Loop Strategies for mRNA Therapeutics', 'Principal Scientist', 'Wan-Chih Su', 'Genentech', '2026-03-10 16:20:00-05', '2026-03-10 16:35:00-05', 'Connected Lab Room', 'Connected Lab'),
    (v_conf_id, 'The Next Generation LIMS: Leveraging Modern Cloud Technology to Unify Quality Labs', 'Senior Director, Veeva LIMS Strategy', 'Justin Lavimodiere', 'Veeva Systems', '2026-03-10 16:35:00-05', '2026-03-10 16:50:00-05', 'Connected Lab Room', 'Connected Lab'),
    (v_conf_id, 'Panel Discussion - Connected Lab', 'Panel with Tim Hoctor, Wan-Chih Su, Vimaldev Devaraja, Justin Lavimodiere', 'Multiple Speakers', 'Various', '2026-03-10 16:50:00-05', '2026-03-10 17:05:00-05', 'Connected Lab Room', 'Connected Lab'),

    -- Late Afternoon - Data Strategy
    (v_conf_id, 'A Data Science Ecosystem to Improve Efficiency in Pharma R&D', 'Mission Lead for the R&D Data Science Ecosystem', 'Dan Gusenleitner', 'Bayer', '2026-03-10 16:05:00-05', '2026-03-10 16:20:00-05', 'Data Strategy Room', 'Data Strategy'),
    (v_conf_id, 'Semantic Tools for Drug Discovery', 'Director, Data & Analytics', 'Julia Fox', 'Takeda', '2026-03-10 16:20:00-05', '2026-03-10 16:50:00-05', 'Data Strategy Room', 'Data Strategy'),
    (v_conf_id, 'Panel Discussion - Data Strategy', 'Panel with Cathy Kuang, Dan Gusenleitner, Julia Fox', 'Cathy Kuang, Dan Gusenleitner, Julia Fox', 'Takeda, Bayer', '2026-03-10 16:50:00-05', '2026-03-10 17:05:00-05', 'Data Strategy Room', 'Data Strategy'),

    -- Live Labs
    (v_conf_id, 'Live Lab A: Building My Lab of the Future', 'VP Research, Pre-clinical and Manufacturing, Data, Technology & Engineering', 'Julie Huxley-Jones', 'Vertex Pharmaceuticals', '2026-03-10 17:05:00-05', '2026-03-10 17:50:00-05', 'Live Lab A', 'Live Lab'),
    (v_conf_id, 'Live Lab B: Safety to Fail', 'Executive Director', 'Steve Winig', 'Novartis', '2026-03-10 17:05:00-05', '2026-03-10 17:50:00-05', 'Live Lab B', 'Live Lab'),

    (v_conf_id, 'Drinks Reception', 'Evening networking reception', NULL, NULL, '2026-03-10 17:35:00-05', '2026-03-10 19:00:00-05', 'Exhibition Room', 'Networking');

    RAISE NOTICE 'Successfully imported LOTF 2026 data!';
    RAISE NOTICE 'Conference ID: %', v_conf_id;
    RAISE NOTICE 'Team ID: %', v_team_id;
    RAISE NOTICE 'User ID: %', v_user_id;

END $$;
