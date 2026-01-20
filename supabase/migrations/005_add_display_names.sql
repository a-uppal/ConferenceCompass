-- Migration: 005_add_display_names.sql
-- Add display name fields for personas and posts (to show team members who aren't auth users)

-- Add author_name to posts for display purposes
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Make team_personas.user_id nullable and add display_name
ALTER TABLE public.team_personas
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.team_personas
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for author_name queries
CREATE INDEX IF NOT EXISTS idx_posts_author_name ON public.posts(author_name);
