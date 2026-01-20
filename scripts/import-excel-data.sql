-- Import data from Data_Compass_LOTF_Strategy_v6.xlsx
-- Run this in Supabase SQL Editor

-- First, let's check if we have the conference
SELECT id, name FROM conferences LIMIT 5;

-- Check if we have sessions
SELECT COUNT(*) as session_count FROM sessions;

-- Check if we have users
SELECT id, email FROM users LIMIT 5;

-- If the above queries show data, the import is already done.
-- If not, run the seed script first, then come back here.

-- ========================================
-- POSTS DATA FROM EXCEL
-- ========================================

-- Get the conference ID and user ID
DO $$
DECLARE
  conf_id UUID;
  anuj_id UUID;
BEGIN
  -- Get conference
  SELECT id INTO conf_id FROM conferences WHERE name LIKE '%Lab of the Future%' LIMIT 1;

  -- Get user
  SELECT id INTO anuj_id FROM users WHERE email = 'anuj.uppal@campana-schott.com' LIMIT 1;

  IF conf_id IS NULL THEN
    RAISE NOTICE 'Conference not found. Run the seed script first.';
    RETURN;
  END IF;

  IF anuj_id IS NULL THEN
    RAISE NOTICE 'User not found. Make sure you are logged in first.';
    RETURN;
  END IF;

  -- Delete existing posts for this conference (to avoid duplicates)
  DELETE FROM posts WHERE conference_id = conf_id;

  -- Insert posts from Excel data
  -- Week 1 Posts (Jan 27 - Feb 2, 2026)
  INSERT INTO posts (conference_id, author_id, scheduled_date, platform, content_preview, status, week_number, post_type)
  VALUES
    (conf_id, anuj_id, '2026-01-28', 'linkedin', 'We spend millions on ''Clean Data''—no duplicates, right formats. Yet 87% of AI projects fail. Why? Because Clean ≠ Ready. Clean is a spreadsheet. Ready is a Compass.', 'scheduled', 1, 'agitate'),
    (conf_id, anuj_id, '2026-01-30', 'linkedin', 'Reviewing the #LotF2026 agenda. Huge lineup from Takeda and Roche. I''m looking to speak with leaders who are tired of their AI pilots stalling.', 'scheduled', 1, 'networking'),

  -- Week 2 Posts (Feb 3-9, 2026)
    (conf_id, anuj_id, '2026-02-04', 'linkedin', 'Most failures I see happen in the top-left quadrant: High Asset Maturity (great data), Low Execution Readiness (resistant teams). We need to measure both.', 'scheduled', 2, 'educate'),
    (conf_id, anuj_id, '2026-02-05', 'linkedin', 'Unpopular opinion: ''Data Governance'' has become a boring compliance checkbox. It needs to be an engineering constraint. This is West (Governance) on our compass.', 'scheduled', 2, 'rant'),

  -- Week 3 Posts (Feb 10-16, 2026)
    (conf_id, anuj_id, '2026-02-11', 'linkedin', 'We need a compass for AI readiness. North: Statistical Health. East: Semantic Clarity. South: Contextual Validity. West: Governance & Safety. Which direction is your organization ignoring?', 'scheduled', 3, 'educate'),
    (conf_id, anuj_id, '2026-02-12', 'linkedin', 'Looking forward to Julia Fox''s (Takeda) talk on Semantic Tools. We can''t have AI ''reason'' if data lacks definitions. This is East on the Compass.', 'scheduled', 3, 'preview'),

  -- Week 4 Posts (Feb 17-23, 2026)
    (conf_id, anuj_id, '2026-02-18', 'linkedin', 'Pharma R&D is the ultimate data fragmentation challenge. 100 labs, 50 instruments, 20 languages. If you''re attending Jeff Williams'' talk, ask: Does your data speak one language?', 'scheduled', 4, 'educate'),
    (conf_id, anuj_id, '2026-02-20', 'linkedin', 'West on the Compass = Governance. Not just legal compliance. It''s the engineering constraint that makes everything else work. Data without governance is a liability at scale.', 'scheduled', 4, 'deep-dive'),

  -- Week 5 Posts (Feb 24 - Mar 2, 2026)
    (conf_id, anuj_id, '2026-02-25', 'linkedin', 'I challenge every speaker at #LotF to answer one question: How do you measure North (Statistical Health)? Is your data learning-ready, or just filled out?', 'scheduled', 5, 'challenge'),
    (conf_id, anuj_id, '2026-02-27', 'linkedin', 'I''m bringing our full ontology mapping demo to Boston. If you want to see how we map raw instrument data to HGNC/UniProt automatically, find me.', 'scheduled', 5, 'demo-promo'),

  -- Week 6 Conference Posts (Mar 9-13, 2026)
    (conf_id, anuj_id, '2026-03-09', 'linkedin', 'Team landed in Boston. Ready to move Beyond Clean. First coffee is on us. #LotF2026', 'scheduled', 6, 'arrival'),
    (conf_id, anuj_id, '2026-03-10', 'linkedin', 'Keynotes from Hans Clevers (Roche), Christopher Arendt (Takeda), Nicole Crane (Accenture). Listening for data readiness, not just quality.', 'scheduled', 6, 'preview'),
    (conf_id, anuj_id, '2026-03-10', 'linkedin', 'Nicole Crane confirmed: Tech stack and Talent stack misaligned. This is why we built Execution Readiness score.', 'scheduled', 6, 'live-reaction'),
    (conf_id, anuj_id, '2026-03-10', 'linkedin', 'Day 1 done. Incredible keynotes, great conversations. Met 3 teams building FAIR infra. Tomorrow: AI track deep dives.', 'scheduled', 6, 'wrap'),
    (conf_id, anuj_id, '2026-03-11', 'linkedin', 'Day 2: AI to Innovate track. Watching Yves (Takeda) on AI drug discovery, Ilan Wapinski (Sanofi) on in-silico.', 'scheduled', 6, 'preview'),
    (conf_id, anuj_id, '2026-03-11', 'linkedin', 'Yves showed Takeda AI pipeline. Impressive scale. But what is ML Readiness score for feeding data? Scale without quality = scaling uncertainty.', 'scheduled', 6, 'live-reaction'),
    (conf_id, anuj_id, '2026-03-11', 'linkedin', 'Day 2 done. Theme: everyone investing in AI platforms but not the data feeding them. Platform only as good as what you give it.', 'scheduled', 6, 'wrap'),
    (conf_id, anuj_id, '2026-03-12', 'linkedin', 'Final day. Data Strategy track - my favorite. Dan Gusenleitner (Bayer) on Data Science Ecosystems. Last chance for booth demos until 4pm.', 'scheduled', 6, 'preview'),
    (conf_id, anuj_id, '2026-03-12', 'linkedin', 'Cathy Kuang (Takeda) on panel. With 5 Takeda speakers, asked: unified data quality standard across Research and Labs? Answer: working on it.', 'scheduled', 6, 'live-reaction'),
    (conf_id, anuj_id, '2026-03-12', 'linkedin', 'That''s a wrap on #LotF2026. 3 days, hundreds of conversations. Clear message: industry ready for AI readiness standard. We''re building it. Thank you Boston.', 'scheduled', 6, 'close'),

  -- Week 7 Follow-up Posts (Mar 17+, 2026)
    (conf_id, anuj_id, '2026-03-17', 'linkedin', 'Heading home. To everyone who stopped by, challenged thinking, shared pain points, booked demos: THANK YOU. Follow-ups going out next week.', 'scheduled', 7, 'gratitude'),
    (conf_id, anuj_id, '2026-03-18', 'linkedin', 'On flight home thinking: gap between data quality and AI readiness is well-understood by practitioners but undersupported by tools. Challenge accepted.', 'scheduled', 7, 'reflection');

  RAISE NOTICE 'Imported 22 posts for conference %', conf_id;
END $$;

-- Verify posts were imported
SELECT
  scheduled_date,
  week_number,
  post_type,
  LEFT(content_preview, 60) as preview,
  status
FROM posts
ORDER BY scheduled_date;
