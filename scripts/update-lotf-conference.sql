-- Update LOTF Conference with correct details
UPDATE public.conferences
SET
    name = 'Lab of the Future',
    location = 'Sheraton Boston Hotel, Boston',
    start_date = '2026-03-01',
    end_date = '2026-03-03',
    description = 'Promote/launch Data Compass. Sponsored by Pistoia Alliance.',
    updated_at = NOW()
WHERE name ILIKE '%LOTF%' OR name ILIKE '%Lab of the Future%';

-- Verify
SELECT id, name, location, start_date, end_date, description FROM public.conferences;
