-- Migration: 006_enhance_contacts_for_ocr.sql
-- Add columns for badge OCR metadata and capture method tracking

-- Add JSONB column for storing full OCR extraction result with confidence scores
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS ocr_extraction_data JSONB;

-- Add overall confidence score (0.00-1.00)
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS ocr_confidence_score DECIMAL(3,2);

-- Add capture method tracking
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS capture_method TEXT
CHECK (capture_method IN ('manual', 'badge_scan', 'import'))
DEFAULT 'manual';

-- Index for analytics on capture method
CREATE INDEX IF NOT EXISTS idx_contacts_capture_method
ON public.contacts(capture_method);

-- Add comments for documentation
COMMENT ON COLUMN public.contacts.ocr_extraction_data IS
  'Raw OCR extraction result including confidence scores for each field';
COMMENT ON COLUMN public.contacts.ocr_confidence_score IS
  'Overall confidence score from 0.00 to 1.00 based on OCR quality';
COMMENT ON COLUMN public.contacts.capture_method IS
  'How the contact was created: manual entry, badge_scan, or import';
