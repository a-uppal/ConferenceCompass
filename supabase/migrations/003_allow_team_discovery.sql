-- Allow authenticated users to view teams for discovery/joining
-- Migration: 003_allow_team_discovery.sql
-- Created: 2026-01-18

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can view teams for discovery" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Add policy to allow authenticated users to view teams (for discovery)
CREATE POLICY "Authenticated users can view teams for discovery" ON public.teams
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add policy to allow authenticated users to insert themselves as team members
CREATE POLICY "Authenticated users can join teams" ON public.team_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND role = 'member'
    );

-- Add policy to allow authenticated users to create their user profile
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
