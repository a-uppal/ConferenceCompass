-- Script to set up the contact-badges storage bucket
-- Run this in Supabase SQL Editor after running the migration

-- Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-badges',
  'contact-badges',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload badge photos to their own folder
CREATE POLICY "Users can upload their own badge photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-badges' AND
  (storage.foldername(name))[1] = 'badges' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Authenticated users can update their own badge photos
CREATE POLICY "Users can update their own badge photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contact-badges' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own badge photos
CREATE POLICY "Users can delete their own badge photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-badges' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Anyone can view badge photos (needed for OCR processing)
CREATE POLICY "Badge photos are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-badges');
