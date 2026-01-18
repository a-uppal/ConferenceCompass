-- Conference Compass Initial Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-01-17

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, user_id)
);

-- ============================================
-- CONFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    captured_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    badge_photo_url TEXT,
    notes TEXT,
    follow_up_status TEXT NOT NULL CHECK (follow_up_status IN ('none', 'pending', 'completed')) DEFAULT 'none',
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    speaker_name TEXT,
    speaker_company TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    session_type TEXT,
    track TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TALKING POINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.talking_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SESSION ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('planned', 'attending', 'attended', 'skipped')) DEFAULT 'planned',
    key_takeaways TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, user_id)
);

-- ============================================
-- SESSION CAPTURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    capture_type TEXT NOT NULL CHECK (capture_type IN ('photo', 'voice_note', 'text_note')),
    content_url TEXT,
    transcription TEXT,
    text_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- POSTS TABLE (LinkedIn/Social Media Posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'other')) DEFAULT 'linkedin',
    content_preview TEXT,
    linkedin_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'published', 'skipped')) DEFAULT 'scheduled',
    week_number INTEGER,
    post_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- POST ENGAGEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('like', 'comment', 'share')),
    engaged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, user_id, engagement_type)
);

-- ============================================
-- TEAM ACTIVITIES TABLE (Activity Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('contact_captured', 'session_attended', 'post_published', 'post_engaged', 'check_in')),
    entity_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- DAILY CHECK-INS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    priorities TEXT,
    location TEXT,
    status TEXT NOT NULL CHECK (status IN ('available', 'busy', 'in_session')) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(conference_id, user_id, check_in_date)
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Conferences
CREATE INDEX IF NOT EXISTS idx_conferences_team_id ON public.conferences(team_id);
CREATE INDEX IF NOT EXISTS idx_conferences_dates ON public.conferences(start_date, end_date);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_conference_id ON public.contacts(conference_id);
CREATE INDEX IF NOT EXISTS idx_contacts_captured_by ON public.contacts(captured_by);
CREATE INDEX IF NOT EXISTS idx_contacts_follow_up ON public.contacts(follow_up_status, follow_up_date);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_conference_id ON public.sessions(conference_id);
CREATE INDEX IF NOT EXISTS idx_sessions_times ON public.sessions(start_time, end_time);

-- Talking Points
CREATE INDEX IF NOT EXISTS idx_talking_points_session_id ON public.talking_points(session_id);

-- Session Attendance
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON public.session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user_id ON public.session_attendance(user_id);

-- Session Captures
CREATE INDEX IF NOT EXISTS idx_session_captures_session_id ON public.session_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_session_captures_user_id ON public.session_captures(user_id);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_conference_id ON public.posts(conference_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON public.posts(scheduled_date, status);

-- Post Engagements
CREATE INDEX IF NOT EXISTS idx_post_engagements_post_id ON public.post_engagements(post_id);
CREATE INDEX IF NOT EXISTS idx_post_engagements_user_id ON public.post_engagements(user_id);

-- Team Activities
CREATE INDEX IF NOT EXISTS idx_team_activities_team_id ON public.team_activities(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_conference_id ON public.team_activities(conference_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_created_at ON public.team_activities(created_at DESC);

-- Daily Check-ins
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_conference_id ON public.daily_check_ins(conference_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_date ON public.daily_check_ins(check_in_date);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conferences_updated_at
    BEFORE UPDATE ON public.conferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_attendance_updated_at
    BEFORE UPDATE ON public.session_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, update own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Teams: members can read, owners/admins can modify
CREATE POLICY "Team members can view teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can update teams" ON public.teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Authenticated users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Team Members: members can view, owners/admins can modify
CREATE POLICY "Team members can view membership" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
        )
    );

-- Conferences: team members can view, admins can modify
CREATE POLICY "Team members can view conferences" ON public.conferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = conferences.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage conferences" ON public.conferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = conferences.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

-- Contacts: team members can view/create
CREATE POLICY "Team members can view contacts" ON public.contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = contacts.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can create contacts" ON public.contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = contacts.conference_id
            AND tm.user_id = auth.uid()
        )
        AND auth.uid() = captured_by
    );

CREATE POLICY "Users can update own contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() = captured_by);

-- Sessions: team members can view
CREATE POLICY "Team members can view sessions" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = sessions.conference_id
            AND tm.user_id = auth.uid()
        )
    );

-- Talking Points: team members can view
CREATE POLICY "Team members can view talking points" ON public.talking_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            JOIN public.conferences c ON c.id = s.conference_id
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE s.id = talking_points.session_id
            AND tm.user_id = auth.uid()
        )
    );

-- Session Attendance: users can manage own attendance
CREATE POLICY "Users can view own attendance" ON public.session_attendance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own attendance" ON public.session_attendance
    FOR ALL USING (auth.uid() = user_id);

-- Session Captures: users can manage own captures
CREATE POLICY "Users can view own captures" ON public.session_captures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create captures" ON public.session_captures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts: team members can view, authors can modify
CREATE POLICY "Team members can view posts" ON public.posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = posts.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Authors can manage own posts" ON public.posts
    FOR ALL USING (auth.uid() = author_id);

-- Post Engagements: users can manage own engagements
CREATE POLICY "Team members can view engagements" ON public.post_engagements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.conferences c ON c.id = p.conference_id
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE p.id = post_engagements.post_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own engagements" ON public.post_engagements
    FOR ALL USING (auth.uid() = user_id);

-- Team Activities: team members can view
CREATE POLICY "Team members can view activities" ON public.team_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = team_activities.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities" ON public.team_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Check-ins: users can manage own check-ins
CREATE POLICY "Team members can view check-ins" ON public.daily_check_ins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conferences c
            JOIN public.team_members tm ON tm.team_id = c.team_id
            WHERE c.id = daily_check_ins.conference_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own check-ins" ON public.daily_check_ins
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_engagements;
