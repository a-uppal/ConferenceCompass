-- Social Media Campaign Management Schema
-- Migration: 004_social_media_campaign.sql
-- Created: 2026-01-18
-- Description: Adds campaign phases, team personas, cross-pollination tracking,
--              content library, and conference schedule for social media campaigns

-- ============================================
-- CAMPAIGN PHASES TABLE
-- Defines the phases of a social media campaign
-- (Agitate, Educate, Hype, Conference, Follow-Up)
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaign_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    week_start INT NOT NULL,
    week_end INT NOT NULL,
    goal TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_weeks CHECK (week_start <= week_end AND week_start > 0)
);

CREATE INDEX IF NOT EXISTS idx_campaign_phases_conference ON public.campaign_phases(conference_id);
CREATE INDEX IF NOT EXISTS idx_campaign_phases_order ON public.campaign_phases(conference_id, order_index);

-- ============================================
-- TEAM PERSONAS TABLE
-- Defines the social media persona for each team member
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    persona_name TEXT NOT NULL,
    lane TEXT,
    tone TEXT,
    key_slides TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(conference_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_personas_conference ON public.team_personas(conference_id);
CREATE INDEX IF NOT EXISTS idx_team_personas_user ON public.team_personas(user_id);

-- ============================================
-- ENHANCE EXISTING POSTS TABLE
-- Add new columns for full campaign management
-- ============================================

-- Add phase_id foreign key
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.campaign_phases(id) ON DELETE SET NULL;

-- Add theme (short title for the post)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS theme TEXT;

-- Add full content (content_preview is just the preview)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS content TEXT;

-- Add visual asset description
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS visual_asset TEXT;

-- Add day of week for scheduling
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS day_of_week TEXT;

-- Add cross-pollination settings
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS cross_pollination_required BOOLEAN DEFAULT TRUE;

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS cross_pollination_window_hours INT DEFAULT 2;

-- Add posted_at timestamp (when actually posted)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- Update status constraint to include 'draft'
-- First drop the old constraint, then add new one
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
    CHECK (status IN ('draft', 'scheduled', 'posted', 'published', 'skipped'));

-- Add index for phase lookup
CREATE INDEX IF NOT EXISTS idx_posts_phase ON public.posts(phase_id);
CREATE INDEX IF NOT EXISTS idx_posts_week ON public.posts(conference_id, week_number);

-- ============================================
-- CROSS-POLLINATION TABLE
-- Tracks the 2-hour comment requirement
-- ============================================
CREATE TABLE IF NOT EXISTS public.cross_pollination (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    required_by TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    comment_url TEXT,
    comment_text TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, commenter_id)
);

CREATE INDEX IF NOT EXISTS idx_cross_pollination_post ON public.cross_pollination(post_id);
CREATE INDEX IF NOT EXISTS idx_cross_pollination_commenter ON public.cross_pollination(commenter_id);
CREATE INDEX IF NOT EXISTS idx_cross_pollination_pending ON public.cross_pollination(commenter_id, status)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_cross_pollination_deadline ON public.cross_pollination(required_by)
    WHERE status = 'pending';

-- ============================================
-- CONTENT LIBRARY TABLE
-- Reusable content snippets
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('statistic', 'framework', 'hashtag', 'cta', 'speaker', 'other')),
    label TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_library_conference ON public.content_library(conference_id);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON public.content_library(conference_id, category);

-- ============================================
-- CONFERENCE SCHEDULE TABLE
-- Hour-by-hour posting schedule for conference week
-- ============================================
CREATE TABLE IF NOT EXISTS public.conference_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    schedule_day DATE NOT NULL,
    schedule_time TIME NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    post_type TEXT NOT NULL,
    content_summary TEXT,
    visual_suggestion TEXT,
    actual_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conference_schedule_conference ON public.conference_schedule(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_schedule_day ON public.conference_schedule(conference_id, schedule_day);
CREATE INDEX IF NOT EXISTS idx_conference_schedule_owner ON public.conference_schedule(owner_id);

-- ============================================
-- CAMPAIGN CONTACTS TABLE
-- People met during the conference (extends contacts)
-- This links to posts and tracks interaction context
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    captured_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    title TEXT,
    linkedin_url TEXT,
    email TEXT,
    notes TEXT,
    interaction_type TEXT CHECK (interaction_type IN ('booth', 'session', 'networking', 'demo_request', 'other')),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    source_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_conference ON public.campaign_contacts(conference_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_captured_by ON public.campaign_contacts(captured_by);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_follow_up ON public.campaign_contacts(conference_id, follow_up_required)
    WHERE follow_up_required = TRUE AND follow_up_completed = FALSE;

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER update_campaign_phases_updated_at
    BEFORE UPDATE ON public.campaign_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_personas_updated_at
    BEFORE UPDATE ON public.team_personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_pollination_updated_at
    BEFORE UPDATE ON public.cross_pollination
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_library_updated_at
    BEFORE UPDATE ON public.content_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_schedule_updated_at
    BEFORE UPDATE ON public.conference_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_contacts_updated_at
    BEFORE UPDATE ON public.campaign_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.campaign_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_pollination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

-- Campaign Phases: team members can view, admins can modify
CREATE POLICY "Team members can view campaign phases" ON public.campaign_phases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = campaign_phases.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage campaign phases" ON public.campaign_phases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = campaign_phases.conference_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Team Personas: team members can view, users can manage own persona
CREATE POLICY "Team members can view personas" ON public.team_personas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = team_personas.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own persona" ON public.team_personas
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all personas" ON public.team_personas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = team_personas.conference_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Cross-Pollination: team members can view, users can manage own tasks
CREATE POLICY "Team members can view cross pollination" ON public.cross_pollination
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.conferences c ON c.id = p.conference_id
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE p.id = cross_pollination.post_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own cross pollination tasks" ON public.cross_pollination
    FOR ALL USING (auth.uid() = commenter_id);

CREATE POLICY "Post authors can create cross pollination tasks" ON public.cross_pollination
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = cross_pollination.post_id
            AND p.author_id = auth.uid()
        )
    );

-- Content Library: team members can view, admins can modify
CREATE POLICY "Team members can view content library" ON public.content_library
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = content_library.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can use content library" ON public.content_library
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = content_library.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage content library" ON public.content_library
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = content_library.conference_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Conference Schedule: team members can view, admins can modify
CREATE POLICY "Team members can view conference schedule" ON public.conference_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = conference_schedule.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage conference schedule" ON public.conference_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = conference_schedule.conference_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Assigned users can update their schedule slots" ON public.conference_schedule
    FOR UPDATE USING (auth.uid() = owner_id);

-- Campaign Contacts: team members can view, users can manage contacts they captured
CREATE POLICY "Team members can view campaign contacts" ON public.campaign_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = campaign_contacts.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage contacts they captured" ON public.campaign_contacts
    FOR ALL USING (auth.uid() = captured_by);

CREATE POLICY "Team members can create campaign contacts" ON public.campaign_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = campaign_contacts.conference_id
            AND tm.user_id = auth.uid()
        )
        AND auth.uid() = captured_by
    );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for cross-pollination alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_pollination;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create cross-pollination tasks when a post is marked as posted
CREATE OR REPLACE FUNCTION create_cross_pollination_tasks()
RETURNS TRIGGER AS $$
DECLARE
    team_member RECORD;
    post_conference_id UUID;
    post_team_id UUID;
    deadline TIMESTAMPTZ;
BEGIN
    -- Only trigger when status changes to 'posted' or 'published'
    IF (NEW.status IN ('posted', 'published') AND OLD.status NOT IN ('posted', 'published')) THEN
        -- Check if cross-pollination is required
        IF NEW.cross_pollination_required = TRUE THEN
            -- Get the conference_id and team_id
            SELECT c.id, c.team_id INTO post_conference_id, post_team_id
            FROM public.conferences c
            WHERE c.id = NEW.conference_id;

            -- Calculate deadline
            deadline := COALESCE(NEW.posted_at, NOW()) + (NEW.cross_pollination_window_hours || ' hours')::INTERVAL;

            -- Create tasks for all team members except the author
            FOR team_member IN
                SELECT tm.user_id
                FROM public.team_members tm
                WHERE tm.team_id = post_team_id
                AND tm.user_id != NEW.author_id
            LOOP
                INSERT INTO public.cross_pollination (post_id, commenter_id, required_by, status)
                VALUES (NEW.id, team_member.user_id, deadline, 'pending')
                ON CONFLICT (post_id, commenter_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cross-pollination task creation
DROP TRIGGER IF EXISTS trigger_create_cross_pollination_tasks ON public.posts;
CREATE TRIGGER trigger_create_cross_pollination_tasks
    AFTER UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION create_cross_pollination_tasks();

-- Function to check and mark missed cross-pollination tasks
-- (Can be called by a scheduled job)
CREATE OR REPLACE FUNCTION mark_missed_cross_pollination()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.cross_pollination
    SET status = 'missed', updated_at = NOW()
    WHERE status = 'pending'
    AND required_by < NOW();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign dashboard stats
CREATE OR REPLACE FUNCTION get_campaign_stats(p_conference_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_posts', (SELECT COUNT(*) FROM public.posts WHERE conference_id = p_conference_id),
        'draft_posts', (SELECT COUNT(*) FROM public.posts WHERE conference_id = p_conference_id AND status = 'draft'),
        'scheduled_posts', (SELECT COUNT(*) FROM public.posts WHERE conference_id = p_conference_id AND status = 'scheduled'),
        'posted_posts', (SELECT COUNT(*) FROM public.posts WHERE conference_id = p_conference_id AND status IN ('posted', 'published')),
        'cross_pollination_pending', (
            SELECT COUNT(*) FROM public.cross_pollination cp
            JOIN public.posts p ON p.id = cp.post_id
            WHERE p.conference_id = p_conference_id AND cp.status = 'pending'
        ),
        'cross_pollination_completed', (
            SELECT COUNT(*) FROM public.cross_pollination cp
            JOIN public.posts p ON p.id = cp.post_id
            WHERE p.conference_id = p_conference_id AND cp.status = 'completed'
        ),
        'cross_pollination_missed', (
            SELECT COUNT(*) FROM public.cross_pollination cp
            JOIN public.posts p ON p.id = cp.post_id
            WHERE p.conference_id = p_conference_id AND cp.status = 'missed'
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_missed_cross_pollination() TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO authenticated;
