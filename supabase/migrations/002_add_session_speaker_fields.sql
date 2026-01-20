-- Migration: 002_add_session_speaker_fields.sql
-- Purpose: Add speaker-specific fields for sales talking points integration
-- Created: 2026-01-18

-- Add new columns to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS speaker_role TEXT,
ADD COLUMN IF NOT EXISTS relevance TEXT,
ADD COLUMN IF NOT EXISTS demo_focus TEXT,
ADD COLUMN IF NOT EXISTS partnership_opportunity TEXT;

-- Add index for sessions with talking points (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_sessions_has_relevance
ON public.sessions(conference_id)
WHERE relevance IS NOT NULL;

-- Comment the columns for documentation
COMMENT ON COLUMN public.sessions.speaker_role IS 'Speaker job title/position (e.g., VP Research, CSO)';
COMMENT ON COLUMN public.sessions.relevance IS 'Why this speaker is relevant to our sales approach';
COMMENT ON COLUMN public.sessions.demo_focus IS 'What to demonstrate to this speaker';
COMMENT ON COLUMN public.sessions.partnership_opportunity IS 'Potential partnership or integration opportunity';
