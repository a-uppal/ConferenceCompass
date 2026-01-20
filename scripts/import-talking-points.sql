-- Import Talking Points from Lab_of_Future_Speaker_Talking_Points.md
-- Run this in Supabase SQL Editor AFTER running the 002 migration
-- This script:
-- 1. Updates sessions with speaker_role, relevance, demo_focus, partnership_opportunity
-- 2. Inserts talking points for each session

-- First, run the migration to add new columns
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS speaker_role TEXT;
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS relevance TEXT;
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS demo_focus TEXT;
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS partnership_opportunity TEXT;

-- ============================================
-- DAY 1 SPEAKERS - Update Sessions & Add Talking Points
-- ============================================

DO $$
DECLARE
    v_session_id UUID;
    v_conf_id UUID;
BEGIN
    -- Get the conference ID
    SELECT id INTO v_conf_id FROM public.conferences
    WHERE name LIKE '%LOTF%' OR name LIKE '%Future%' OR name LIKE '%Leaders%'
    LIMIT 1;

    IF v_conf_id IS NULL THEN
        RAISE NOTICE 'Conference not found. Please run the seed data first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found conference: %', v_conf_id;

    -- ========================================
    -- JULIE HUXLEY-JONES - Vertex
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Julie Huxley%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'VP Research, Pre-clinical and Manufacturing, Data, Technology & Engineering',
            relevance = 'VP-level decision maker spanning Research + Data + Technology + Engineering. Live Lab host indicates she''s defining Vertex''s Lab of the Future vision.',
            demo_focus = 'Journey-based assessment workflow showing Research → Data Quality → ML Readiness pipeline',
            description = 'Opening remarks and introduction to the Lab of the Future Congress 2026'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'How is Vertex ensuring data generated in pre-clinical labs is AI/ML-ready from day one?', 'Data Quality', 1),
        (v_session_id, 'We''ve seen clients struggle with data quality issues discovered only when ML teams try to use the data. FAIR Compass provides proactive readiness assessment.', 'Value Prop', 2),
        (v_session_id, 'Your Live Lab session on "Building My Lab of the Future" - are you including FAIR data principles as a foundational layer?', 'Discovery', 3);

        RAISE NOTICE 'Updated Julie Huxley-Jones';
    END IF;

    -- ========================================
    -- HANS CLEVERS - Roche
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Hans Clevers%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Head of Pharma Research and Early Development',
            relevance = 'Senior R&D leadership at top-5 pharma. Directly responsible for early-stage research data strategies.',
            demo_focus = 'Ontology integration showing HGNC, Gene Ontology, UniProt mappings - directly relevant to Roche''s research data',
            description = 'Exploring how data, biology, and technology are transforming drug discovery and development at Roche'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'You mentioned "rewriting the rules" - how is Roche ensuring research datasets are FAIR-compliant as they''re generated?', 'FAIR', 1),
        (v_session_id, 'FAIR Compass automates the assessment of 140+ indicators across Findable, Accessible, Interoperable, Reusable dimensions.', 'Product', 2),
        (v_session_id, 'With Roche''s massive data volumes, how do you maintain data quality and provenance from discovery through development?', 'Discovery', 3);

        RAISE NOTICE 'Updated Hans Clevers';
    END IF;

    -- ========================================
    -- NICOLE CRANE - Accenture
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Nicole Crane%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Senior Principal',
            relevance = 'Strategic advisor influencing pharma technology decisions. Key partner opportunity.',
            demo_focus = 'Data quality assessment workflow demonstrating ROI for consulting engagements',
            partnership_opportunity = 'Accenture could recommend FAIR Compass as part of Lab of the Future assessments',
            description = 'Examining alignment between technology investments and talent capabilities in pharma R&D'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'When assessing tech stack readiness, do you evaluate clients'' data quality infrastructure?', 'Discovery', 1),
        (v_session_id, 'We see a common gap: organizations invest in ML platforms but their underlying data isn''t ML-ready. FAIR Compass bridges this gap.', 'Value Prop', 2),
        (v_session_id, 'Has Accenture seen correlation between FAIR data maturity and AI project success rates?', 'Partnership', 3);

        RAISE NOTICE 'Updated Nicole Crane';
    END IF;

    -- ========================================
    -- CHRISTOPHER ARENDT - Takeda
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Christopher Arendt%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'CSO, Head of Research',
            relevance = 'Chief Science Officer - owns R&D data strategy at major pharma. "Foundation" theme aligns perfectly with FAIR principles.',
            demo_focus = 'Organization-level Execution Risk gauge showing People + Governance + Standards readiness',
            description = 'Building the foundational infrastructure for tomorrow''s laboratories through strategy, skills, systems and science'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Your focus on "foundation" resonates - FAIR data principles ARE the foundation for AI-enabled labs.', 'FAIR', 1),
        (v_session_id, 'Takeda has multiple speakers here (Yves Fomekong Nanfack, Hans Bitter, Julia Fox, Sagar Kokal). Is Takeda implementing a unified data quality standard across Research?', 'Discovery', 2),
        (v_session_id, 'FAIR Compass provides the assessment framework to measure if your foundation is truly AI-ready.', 'Product', 3);

        RAISE NOTICE 'Updated Christopher Arendt';
    END IF;

    -- ========================================
    -- MARK FISH - Thermo Fisher Scientific
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Mark Fish%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'VP & GM of Digital Lab Solutions',
            relevance = 'Vendor perspective - potential integration partner. Digital Lab Solutions directly relevant.',
            demo_focus = 'Instrument data quality assessment showing integration possibilities',
            partnership_opportunity = 'Position FAIR Compass as complementary to Thermo Fisher''s data ecosystem',
            description = 'Creating interconnected data systems that power the laboratory of the future'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'How does Thermo Fisher ensure data quality and FAIR compliance across your instrument data outputs?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass could integrate with Thermo Fisher''s digital lab solutions to provide automatic FAIR assessment of generated data.', 'Partnership', 2),
        (v_session_id, 'Your customers struggle with data quality issues downstream - we can help them assess readiness upfront.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Mark Fish';
    END IF;

    -- ========================================
    -- JAMES LOVE - Novo Nordisk
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%James Love%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Vice President, Cross Modalities Workflows',
            relevance = 'Autonomous labs generate massive data - who validates quality? "Self-driving" labs need automated data assessment.',
            demo_focus = 'Automated station workflow - show how FAIR Compass can be embedded in autonomous lab pipelines',
            description = 'The continued evolution of wet lab research towards lights-out, self-driving, and human-augmented approaches'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'As labs become more autonomous, how do you ensure the data being generated is high-quality and ML-ready?', 'Discovery', 1),
        (v_session_id, 'Self-driving labs will generate exponentially more data - FAIR Compass provides automated, continuous quality assessment.', 'Value Prop', 2),
        (v_session_id, 'Human augmentation suggests AI assistance - our Ask FAIRy chatbot provides natural language insights on data quality.', 'Product', 3);

        RAISE NOTICE 'Updated James Love';
    END IF;

    -- ========================================
    -- SAM MICHAEL - GSK
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Sam Michael%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'VP, Data, Automation & Predictive Sciences',
            relevance = 'Direct responsibility for Data + Automation + Predictive Sciences. Perfect alignment.',
            demo_focus = 'ML Readiness station with bias detection, statistical sufficiency, feature engineering assessment',
            description = 'Leveraging data automation and automotive industry tools to support biopharma R&D processes'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'What data quality standards does GSK apply to data feeding predictive models?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass assesses ML readiness including bias detection, feature engineering readiness, and training data sufficiency.', 'Product', 2),
        (v_session_id, 'Your "Automotive Tools" theme - we think of FAIR assessment as the "quality inspection" before data enters the ML pipeline.', 'Analogy', 3);

        RAISE NOTICE 'Updated Sam Michael';
    END IF;

    -- ========================================
    -- AMRIK MAHAL & HEBE MIDDLEMISS - AstraZeneca
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Amrik Mahal%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Global Head of IT for Research / Senior Director, AI Strategy and Innovation',
            relevance = 'AZ''s 2030 vision for labs. "Capturing Data at Source" is EXACTLY when FAIR assessment should happen.',
            demo_focus = 'FAIR-by-Design Template System + Live Checks station showing real-time validation',
            description = 'AstraZeneca''s Lab of 2030 vision: capturing data at source, intelligent orchestration, and AI-driven innovation'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Your "data at source" principle aligns perfectly with FAIR-by-Design. Are you assessing FAIR compliance as data is generated?', 'FAIR', 1),
        (v_session_id, 'FAIR Compass enables "intelligent orchestration" by providing quality signals that guide data through appropriate workflows.', 'Value Prop', 2),
        (v_session_id, 'For AI-driven innovation - how do you ensure research data meets ML readiness criteria before AI teams access it?', 'Discovery', 3);

        RAISE NOTICE 'Updated Amrik Mahal & Hebe Middlemiss';
    END IF;

    -- ========================================
    -- HANS BITTER - Takeda
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Hans Bitter%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Head of Computational Science, Data Strategy & Senior R&D Leadership Team',
            relevance = 'Data Strategy leader. Direct buyer persona.',
            demo_focus = 'Portfolio Dashboard showing aggregated FAIR scores across datasets, trend analysis',
            description = 'Creating a data ecosystem that enables the laboratory of the future at Takeda'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'How does Takeda measure data ecosystem health? FAIR Compass provides portfolio-level FAIR maturity tracking.', 'Product', 1),
        (v_session_id, 'Data ecosystems need quality standards - we provide automated assessment against 16 FAIR rules + ML readiness criteria.', 'Product', 2),
        (v_session_id, 'Your Senior R&D Leadership Team role - have you seen correlation between FAIR scores and AI project success?', 'Discovery', 3);

        RAISE NOTICE 'Updated Hans Bitter';
    END IF;

    -- ========================================
    -- YVES FOMEKONG NANFACK - Takeda
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Yves Fomekong%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Head of AI/ML Research',
            relevance = 'Direct owner of AI/ML initiatives. Needs ML-ready data.',
            demo_focus = 'ML Readiness Assessment with all Tier 1 metrics (sufficiency, bias, feature engineering)',
            description = 'Driving the next frontier of AI-powered drug discovery at Takeda'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'What percentage of your AI/ML projects are delayed due to data quality or preparation issues?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass provides upfront ML readiness assessment - bias detection, feature engineering readiness, statistical sufficiency.', 'Product', 2),
        (v_session_id, 'We can tell your data scientists "this dataset is 82% ML-ready" BEFORE they spend months preparing it.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Yves Fomekong Nanfack';
    END IF;

    -- ========================================
    -- ILAN WAPINSKI - Sanofi
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Ilan Wapinski%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Head of Digital In-Silico Research',
            relevance = 'In-silico modeling requires high-quality input data. "Enabling Scientists" = self-service data assessment.',
            demo_focus = 'Ontology Inference station + Ask FAIRy chat for scientist self-service',
            description = 'Enabling scientists through digital innovation and in-silico modeling at Sanofi'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'In-silico models are only as good as their training data. How does Sanofi validate input data quality?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass enables scientists to self-assess their data quality before feeding it to models.', 'Value Prop', 2),
        (v_session_id, 'Our ontology integration covers common life sciences vocabularies - HGNC, Gene Ontology, UniProt, ChEBI.', 'Product', 3);

        RAISE NOTICE 'Updated Ilan Wapinski';
    END IF;

    -- ========================================
    -- JESSE MULCAHY - Eli Lilly
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Jesse Mulcahy%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Genetic Medicine Lab Automation Lead',
            relevance = 'Genetic medicine = genomics data. Automation = high throughput data generation.',
            demo_focus = 'Ontology profile configuration for genomics data',
            description = 'Lab automation at Eli Lilly''s Boston Seaport Innovation Centre'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'How do you maintain data quality standards at automation scale?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass is designed for high-throughput assessment - it can evaluate datasets as they''re generated.', 'Product', 2),
        (v_session_id, 'Genetic medicine data has specific ontology requirements - we support HGNC, NCBI Gene, UniProt.', 'Product', 3);

        RAISE NOTICE 'Updated Jesse Mulcahy';
    END IF;

    -- ========================================
    -- PETRINA KAMYA - Insilico Medicine
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Petrina Kamya%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'VP, Global Head of AI Platforms',
            relevance = 'Fully autonomous = no human data QC. Critical need for automated assessment.',
            demo_focus = 'Automated pipeline integration concept - FAIR Compass as a service in the automation workflow',
            description = 'Humanoids and fully autonomous labs in drug discovery'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'In a fully autonomous lab, who validates data quality? The robot can''t catch bias issues.', 'Challenge', 1),
        (v_session_id, 'FAIR Compass provides the "data quality layer" for autonomous labs - automated, continuous assessment.', 'Value Prop', 2),
        (v_session_id, 'Your AI platforms need ML-ready data. We assess readiness BEFORE it hits your models.', 'Product', 3);

        RAISE NOTICE 'Updated Petrina Kamya';
    END IF;

    -- ========================================
    -- PAMELA SEPULVEDA - Pfizer
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Pamela Sepulveda%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Director, Digital Strategy',
            relevance = 'Digital Strategy leader at top-3 pharma. Agentic AI needs quality data.',
            demo_focus = 'Bridge AI synthesis showing how our AI interprets FAIR assessment results',
            description = 'Pfizer use case: Leveraging agentic AI in practice for R&D'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Agentic AI systems make autonomous decisions. How do you ensure they''re working with quality data?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass can integrate with agentic workflows to validate data quality before AI agents act on it.', 'Product', 2),
        (v_session_id, 'Your emerging tech focus - we see FAIR assessment as foundational infrastructure for any AI initiative.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Pamela Sepulveda';
    END IF;

    -- ========================================
    -- JORGE REIS-FILHO - AstraZeneca
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Jorge Reis%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Chief AI and Data Scientist, Oncology R&D',
            relevance = 'Oncology data scientist - high stakes, high data quality requirements. Foundation models need massive, clean data.',
            demo_focus = 'ML Readiness + Data Lineage + Bias Detection - full oncology use case',
            description = 'Scaling AI in R&D through foundation models and agentic frameworks at AstraZeneca Oncology'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Foundation models require diverse, high-quality training data. How do you assess dataset quality at scale?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass assesses ML readiness including bias detection - critical for oncology AI.', 'Product', 2),
        (v_session_id, 'Agentic frameworks need data provenance - our lineage tracking shows exactly where data came from.', 'Product', 3);

        RAISE NOTICE 'Updated Jorge Reis-Filho';
    END IF;

    -- ========================================
    -- MICHAIL VLYSIDIS - AbbVie
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Michail Vlysidis%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Senior Engineer, Technology II',
            relevance = 'Chatbot development - we have Ask FAIRy. Technical peer discussion opportunity.',
            demo_focus = 'Ask FAIRy chatbot demonstration - show natural language Q&A about data quality',
            description = 'Advancing laboratory analysis with AI-powered chatbots at AbbVie'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'We''ve built Ask FAIRy - a natural language interface for data quality insights. What''s your chatbot architecture?', 'Technical', 1),
        (v_session_id, 'Our chatbot synthesizes FAIR assessment results into plain-English recommendations.', 'Product', 2),
        (v_session_id, 'How do you ensure the data your chatbot references is high-quality?', 'Discovery', 3);

        RAISE NOTICE 'Updated Michail Vlysidis';
    END IF;

    -- ========================================
    -- KRISTINA LOPEZ & NICOLE MEDEIROS - J&J
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Kristina Lopez%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Senior Director - Digital & Automation, Cell & Gene Therapy / Principal Scientist, Data Science Automation',
            relevance = 'Cell & Gene Therapy requires pristine data quality. Two-person presentation suggests organizational priority.',
            demo_focus = 'Data Lineage tracking + ALCOA+ compliance lens (if relevant to CGT)',
            description = 'Intelligent automation in biologics development at J&J Innovative Medicine'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Cell & Gene Therapy regulatory submissions require complete data provenance. How do you track lineage?', 'Regulatory', 1),
        (v_session_id, 'FAIR Compass provides full data lineage tracking - we can trace every data transformation.', 'Product', 2),
        (v_session_id, 'Your Digital & Automation + Data Science pairing is smart - we see those teams needing shared data quality standards.', 'Observation', 3);

        RAISE NOTICE 'Updated Kristina Lopez & Nicole Medeiros';
    END IF;

    -- ========================================
    -- DAN GUSENLEITNER - Bayer
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Dan Gusenleitner%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Mission Lead for the R&D Data Science Ecosystem',
            relevance = '"Mission Lead" for Data Science Ecosystem. Direct buyer persona.',
            demo_focus = 'Portfolio Dashboard showing data science team view of quality metrics',
            description = 'A data science ecosystem to improve efficiency in pharma R&D at Bayer'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'What percentage of your data science projects are delayed due to data quality issues?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass provides proactive assessment - data scientists know quality upfront.', 'Value Prop', 2),
        (v_session_id, 'Your ecosystem mission - does it include standardized data quality metrics across teams?', 'Discovery', 3);

        RAISE NOTICE 'Updated Dan Gusenleitner';
    END IF;

    -- ========================================
    -- JULIA FOX - Takeda
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Julia Fox%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Director, Data & Analytics',
            relevance = 'Semantic tools = ontologies. Direct alignment with our ontology features.',
            demo_focus = 'Ontology Inference station + Semantic Interoperability assessment',
            description = 'Semantic tools for drug discovery at Takeda'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Our ontology integration maps columns to semantic terms - HGNC, Gene Ontology, UniProt, ChEBI.', 'Product', 1),
        (v_session_id, 'FAIR Compass can validate ontology coverage as part of the Interoperability assessment.', 'Product', 2),
        (v_session_id, 'What semantic standards is Takeda adopting for drug discovery data?', 'Discovery', 3);

        RAISE NOTICE 'Updated Julia Fox';
    END IF;

    -- ========================================
    -- STEVE WINIG - Novartis
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Steve Winig%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Executive Director',
            relevance = '"Safety to Fail" = experimentation culture. Data quality enables confident experimentation.',
            demo_focus = 'Data quality confidence metrics - showing uncertainty/completeness',
            description = 'Safety to fail - enabling experimentation culture in R&D at Novartis'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Safety to fail requires confidence in your data. FAIR Compass provides that confidence.', 'Value Prop', 1),
        (v_session_id, 'When experiments fail, you need to know it''s not because of data quality issues.', 'Value Prop', 2),
        (v_session_id, 'We help organizations build "data confidence" so they can experiment boldly.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Steve Winig';
    END IF;

    -- ========================================
    -- DENISE TEOTICO - Sanofi
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Denise Teotico%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Senior Director, Digital R&D Product Line Owner, In Silico CMC',
            relevance = 'CMC data = regulatory critical. In-silico = model-dependent on data quality.',
            demo_focus = 'CMC-focused data quality assessment (manufacturing parameters, stability data)',
            description = 'In-Silico CMC: Accelerating digital drug development at Sanofi'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'In-silico CMC models need validated input data. How do you assess data quality for CMC modeling?', 'Discovery', 1),
        (v_session_id, 'CMC data has specific quality requirements - FAIR Compass can be configured for manufacturing contexts.', 'Product', 2),
        (v_session_id, 'Your "Digital Drug Development" vision - data quality is foundational for digital twins.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Denise Teotico';
    END IF;

    -- ========================================
    -- NEVIN GEREK INCE - Novo Nordisk
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Nevin Gerek%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Director, Data and Solutions Engineering',
            relevance = 'Data Engineering leader building infrastructure.',
            demo_focus = 'API integration capabilities - show how FAIR Compass fits in data pipelines',
            description = 'Building the digital ecosystem for the lab of the future at Novo Nordisk'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'In your digital ecosystem, where does data quality assessment fit?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass can integrate into data pipelines - assess quality as data flows through the ecosystem.', 'Product', 2),
        (v_session_id, 'Are you implementing FAIR principles as a standard in your data engineering practices?', 'Discovery', 3);

        RAISE NOTICE 'Updated Nevin Gerek Ince';
    END IF;

    -- ========================================
    -- MARTINA MITEVA - Bristol Myers Squibb
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Martina Miteva%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Director, R&D IT, Instrument Operations & Data Management',
            relevance = 'Three BMS leaders presenting together = major initiative. "Speeding the Clock" = efficiency focus.',
            demo_focus = 'Full workflow: Instrument data → FAIR Assessment → Prediction readiness',
            description = 'Speeding the clock of research - systems integration and technology case study at BMS'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'Speeding the clock requires clean data pipelines. How do you assess data quality at the instrument level?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass can integrate with instruments to assess data quality at source - before it enters downstream systems.', 'Product', 2),
        (v_session_id, 'Your IT + Data + Innovation trinity - we see FAIR assessment bridging all three domains.', 'Observation', 3);

        RAISE NOTICE 'Updated Martina Miteva';
    END IF;

    -- ========================================
    -- VIMALDEV DEVARAJA - J&J
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Vimaldev Devaraja%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Principal Platform Manager',
            relevance = 'Platform integration lead. E2E digital continuity needs consistent data quality standards.',
            demo_focus = 'Cross-system data quality assessment concept',
            description = 'Uniting LIMS, ELN, Reagent Management and Analytical Systems for E2E digital continuity at J&J'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'E2E digital continuity requires consistent data quality across systems. How do you maintain standards across LIMS, ELN, and analytical?', 'Discovery', 1),
        (v_session_id, 'FAIR Compass can serve as the unified data quality layer across your integrated platforms.', 'Value Prop', 2),
        (v_session_id, 'We see clients struggle with quality degradation at system boundaries - FAIR assessment catches these issues.', 'Value Prop', 3);

        RAISE NOTICE 'Updated Vimaldev Devaraja';
    END IF;

    -- ========================================
    -- WAN-CHIH SU - Genentech
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Wan-Chih Su%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Principal Scientist',
            relevance = 'mRNA therapeutics = cutting edge. Lab-in-a-Loop = automated data flows needing quality gates.',
            demo_focus = 'Lab-in-a-Loop integration concept - FAIR Compass as quality gate in automated cycles',
            description = 'Lab-in-a-Loop strategies for automated experimentation in mRNA therapeutics at Genentech'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'In a Lab-in-a-Loop, bad data leads to bad decisions that then generate more bad data. How do you break this cycle?', 'Challenge', 1),
        (v_session_id, 'FAIR Compass can serve as a quality gate in your loop - validating data before it drives decisions.', 'Value Prop', 2),
        (v_session_id, 'mRNA data has specific quality needs - we can assess sequence data, expression data, stability data.', 'Product', 3);

        RAISE NOTICE 'Updated Wan-Chih Su';
    END IF;

    -- ========================================
    -- JUSTIN LAVIMODIERE - Veeva Systems
    -- ========================================
    SELECT id INTO v_session_id FROM public.sessions
    WHERE speaker_name ILIKE '%Justin Lavimodiere%' AND conference_id = v_conf_id
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        UPDATE public.sessions SET
            speaker_role = 'Senior Director, Veeva LIMS Strategy',
            relevance = 'LIMS vendor - potential integration partner. "Quality Labs" = data quality focus.',
            demo_focus = 'Integration concept with LIMS systems',
            partnership_opportunity = 'Position FAIR Compass as complementary to Veeva LIMS',
            description = 'The next generation LIMS: Leveraging modern cloud technology to unify quality labs'
        WHERE id = v_session_id;

        DELETE FROM public.talking_points WHERE session_id = v_session_id;
        INSERT INTO public.talking_points (session_id, content, category, priority) VALUES
        (v_session_id, 'LIMS captures lab data, but who assesses if that data is FAIR-compliant and ML-ready?', 'Challenge', 1),
        (v_session_id, 'FAIR Compass could integrate with Veeva LIMS to provide automatic FAIR assessment on stored data.', 'Partnership', 2),
        (v_session_id, 'Your "Quality Labs" vision aligns with our FAIR quality assessment mission.', 'Observation', 3);

        RAISE NOTICE 'Updated Justin Lavimodiere';
    END IF;

    RAISE NOTICE 'Import complete! Check session details to see talking points.';

END $$;

-- Verify the import
SELECT
    s.speaker_name,
    s.speaker_role,
    s.relevance IS NOT NULL as has_relevance,
    COUNT(tp.id) as talking_points_count
FROM public.sessions s
LEFT JOIN public.talking_points tp ON tp.session_id = s.id
WHERE s.speaker_name IS NOT NULL
GROUP BY s.id, s.speaker_name, s.speaker_role, s.relevance
ORDER BY s.start_time;
