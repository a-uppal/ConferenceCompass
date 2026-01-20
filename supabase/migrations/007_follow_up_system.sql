-- Migration: 007_follow_up_system.sql
-- Smart Follow-Up System: tables for tracking follow-ups, reminders, and history

-- =============================================
-- 1. Enhance contacts table for follow-up tracking
-- =============================================

-- Channel used for follow-up (linkedin, email, phone, other)
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS follow_up_channel TEXT
CHECK (follow_up_channel IN ('linkedin', 'email', 'phone', 'other'));

-- The actual message that was sent
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS follow_up_message TEXT;

-- When the follow-up was sent
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ;

-- Response tracking
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS follow_up_response_status TEXT
CHECK (follow_up_response_status IN ('pending', 'replied', 'no_response', 'meeting_booked'));

-- Priority score for sorting (higher = more important to follow up)
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

-- Index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_contacts_follow_up_status
ON public.contacts(follow_up_status, follow_up_date);

CREATE INDEX IF NOT EXISTS idx_contacts_priority
ON public.contacts(priority_score DESC) WHERE follow_up_status = 'pending';

-- =============================================
-- 2. Create follow_up_reminders table
-- =============================================

CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('initial', 'follow_up', 'check_in')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'dismissed')) DEFAULT 'pending',
  notification_id TEXT, -- Expo push notification ID for cancellation
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(contact_id, user_id, remind_at)
);

-- Indexes for reminder queries
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_pending
ON public.follow_up_reminders(remind_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user
ON public.follow_up_reminders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_contact
ON public.follow_up_reminders(contact_id);

-- =============================================
-- 3. Create follow_up_history table
-- =============================================

CREATE TABLE IF NOT EXISTS public.follow_up_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'email', 'phone', 'other')),
  message_style TEXT CHECK (message_style IN ('professional', 'casual', 'brief')),
  message_content TEXT,
  ai_generated BOOLEAN DEFAULT true,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  response_received BOOLEAN DEFAULT FALSE,
  response_at TIMESTAMPTZ,
  response_type TEXT CHECK (response_type IN ('positive', 'neutral', 'negative', 'meeting_scheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for history queries
CREATE INDEX IF NOT EXISTS idx_follow_up_history_contact
ON public.follow_up_history(contact_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_follow_up_history_user
ON public.follow_up_history(user_id, sent_at DESC);

-- =============================================
-- 4. Enable Row Level Security
-- =============================================

ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follow_up_reminders
CREATE POLICY "Users can view own reminders"
ON public.follow_up_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
ON public.follow_up_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
ON public.follow_up_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
ON public.follow_up_reminders FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for follow_up_history
CREATE POLICY "Users can view own follow-up history"
ON public.follow_up_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own follow-up history"
ON public.follow_up_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-up history"
ON public.follow_up_history FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- 5. Add comments for documentation
-- =============================================

COMMENT ON TABLE public.follow_up_reminders IS
  'Scheduled reminders for following up with contacts';

COMMENT ON TABLE public.follow_up_history IS
  'History of all follow-up attempts with contacts';

COMMENT ON COLUMN public.contacts.follow_up_channel IS
  'Channel used for follow-up: linkedin, email, phone, other';

COMMENT ON COLUMN public.contacts.follow_up_message IS
  'The message content that was sent';

COMMENT ON COLUMN public.contacts.follow_up_sent_at IS
  'Timestamp when follow-up was sent';

COMMENT ON COLUMN public.contacts.follow_up_response_status IS
  'Status of response: pending, replied, no_response, meeting_booked';

COMMENT ON COLUMN public.contacts.priority_score IS
  'Priority score for follow-up (higher = more important)';

COMMENT ON COLUMN public.follow_up_reminders.reminder_type IS
  'Type: initial (first follow-up), follow_up (second attempt), check_in (later check)';

COMMENT ON COLUMN public.follow_up_history.message_style IS
  'AI message style used: professional, casual, brief';

COMMENT ON COLUMN public.follow_up_history.ai_generated IS
  'Whether the message was AI-generated or manually written';
