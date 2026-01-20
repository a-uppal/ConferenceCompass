# Conference Compass: Badge Scanning & Smart Follow-Up System
## Design Document v1.0

**Created:** January 19, 2026
**Author:** Claude (AI Assistant)
**Status:** Draft - Awaiting Review
**Features:** #1 Intelligent Badge Scanning, #2 Smart Follow-Up System

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature #1: Intelligent Badge Scanning](#2-feature-1-intelligent-badge-scanning)
   - 2.1 [Overview](#21-overview)
   - 2.2 [User Stories](#22-user-stories)
   - 2.3 [User Flow](#23-user-flow)
   - 2.4 [Technical Architecture](#24-technical-architecture)
   - 2.5 [Database Schema](#25-database-schema)
   - 2.6 [API Design](#26-api-design)
   - 2.7 [UI/UX Design](#27-uiux-design)
   - 2.8 [Edge Cases](#28-edge-cases)
   - 2.9 [Implementation Phases](#29-implementation-phases)
3. [Feature #2: Smart Follow-Up System](#3-feature-2-smart-follow-up-system)
   - 3.1 [Overview](#31-overview)
   - 3.2 [User Stories](#32-user-stories)
   - 3.3 [User Flow](#33-user-flow)
   - 3.4 [Technical Architecture](#34-technical-architecture)
   - 3.5 [Database Schema](#35-database-schema)
   - 3.6 [API Design](#36-api-design)
   - 3.7 [UI/UX Design](#37-uiux-design)
   - 3.8 [AI Prompt Engineering](#38-ai-prompt-engineering)
   - 3.9 [Edge Cases](#39-edge-cases)
   - 3.10 [Implementation Phases](#310-implementation-phases)
4. [Shared Infrastructure](#4-shared-infrastructure)
5. [Security & Privacy Considerations](#5-security--privacy-considerations)
6. [Testing Strategy](#6-testing-strategy)
7. [Success Metrics](#7-success-metrics)
8. [Open Questions](#8-open-questions)
9. [Appendix](#9-appendix)

---

## 1. Executive Summary

### Problem Statement

Conference attendees lose significant value due to two friction points:

1. **Contact Capture Friction:** Manually entering contact details from badges takes 30-60 seconds per person, causing users to either skip capturing contacts or forget details later.

2. **Follow-Up Friction:** After conferences, 80%+ of captured contacts receive no follow-up because composing personalized messages is time-consuming.

### Solution

1. **Intelligent Badge Scanning:** Point camera at badge → AI extracts and structures contact information → Contact created in under 5 seconds with minimal user input.

2. **Smart Follow-Up System:** AI generates personalized follow-up message drafts based on context (sessions attended, notes captured, contact details) → User reviews/edits → One-tap to send via LinkedIn or email.

### Expected Outcomes

- Reduce contact capture time from 45 seconds to under 10 seconds
- Increase contact capture rate by 3x
- Increase follow-up completion rate from ~20% to ~70%
- Measurable increase in post-conference meeting bookings

---

## 2. Feature #1: Intelligent Badge Scanning

### 2.1 Overview

Transform the existing badge photo capture into an intelligent OCR-powered contact creation system.

**Current State:**
- `app/contact/capture.tsx` - Basic camera capture exists
- `contacts` table stores badge_photo_url but requires manual data entry
- `supabase/functions/process-badge-photo/index.ts` - Incomplete OCR function

**Target State:**
- Camera captures badge → AI extracts text → Structured contact data returned → User confirms/edits → Contact saved

### 2.2 User Stories

```
US-1.1: As a conference attendee, I want to scan a badge and have contact
        details auto-populated so I can capture contacts quickly without typing.

US-1.2: As a user, I want to see confidence indicators on extracted fields
        so I know which fields might need manual correction.

US-1.3: As a user, I want to manually override any auto-extracted field
        so I can fix OCR errors before saving.

US-1.4: As a user, I want the option to search LinkedIn for the contact
        so I can verify their profile and add their LinkedIn URL.

US-1.5: As a user, I want to add quick voice/text notes immediately after
        scanning so I remember context about the conversation.

US-1.6: As a user, I want to capture multiple badges quickly in "batch mode"
        at busy networking events.
```

### 2.3 User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BADGE SCANNING USER FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

[Home Screen]
    │
    ▼ Tap "Capture Badge" quick action
    │
[Camera Screen]
    │ - Full screen camera preview
    │ - Badge alignment guide overlay (rectangle)
    │ - "Position badge within frame" hint
    │ - Capture button
    │ - Flash toggle
    │
    ▼ User captures photo
    │
[Processing Screen] (1-3 seconds)
    │ - Spinner with "Analyzing badge..."
    │ - Photo thumbnail shown
    │ - Cancel option
    │
    ▼ AI returns extracted data
    │
[Review & Edit Screen]
    │ ┌─────────────────────────────────────────┐
    │ │ [Badge Photo Thumbnail]                 │
    │ │                                         │
    │ │ First Name: [John        ] ✓ High      │
    │ │ Last Name:  [Smith       ] ✓ High      │
    │ │ Company:    [Acme Corp   ] ✓ High      │
    │ │ Title:      [VP Sales    ] ⚠ Medium    │
    │ │ Email:      [j.smith@... ] ✓ High      │
    │ │ Phone:      [            ] ✗ Not found │
    │ │                                         │
    │ │ [🔍 Find on LinkedIn]                   │
    │ │                                         │
    │ │ Quick Note (optional):                  │
    │ │ [Met at AI session, interested in...]   │
    │ │                                         │
    │ │ [Cancel]              [Save Contact]    │
    │ └─────────────────────────────────────────┘
    │
    ▼ User taps "Save Contact"
    │
[Success Screen]
    │ - "Contact saved!" confirmation
    │ - [Scan Another] [View Contact] [Done]
    │
    ▼ If "Scan Another" → Return to Camera Screen (Batch Mode)
```

### 2.4 Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BADGE SCANNING ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐
│   Mobile     │    │   Supabase   │    │      External APIs           │
│   App        │    │   Backend    │    │                              │
└──────────────┘    └──────────────┘    └──────────────────────────────┘
       │                   │                        │
       │ 1. Capture photo  │                        │
       │──────────────────▶│                        │
       │                   │                        │
       │ 2. Upload to      │                        │
       │    Storage        │                        │
       │──────────────────▶│                        │
       │                   │                        │
       │ 3. Call Edge      │ 4. Call Vision API    │
       │    Function       │───────────────────────▶│
       │──────────────────▶│                        │ Claude Vision API
       │                   │◀───────────────────────│ (or Google Vision)
       │                   │    OCR text response   │
       │                   │                        │
       │                   │ 5. Parse & Structure   │
       │                   │    with Claude AI      │
       │                   │───────────────────────▶│
       │                   │◀───────────────────────│ Claude API
       │                   │   Structured JSON      │
       │                   │                        │
       │ 6. Return         │                        │
       │    structured     │                        │
       │◀──────────────────│                        │
       │    contact data   │                        │
       │                   │                        │
       │ 7. User confirms  │                        │
       │    & saves        │                        │
       │──────────────────▶│                        │
       │                   │ 8. Insert contact      │
       │                   │                        │
```

#### Component Breakdown

**Mobile App Components:**
```
app/
├── contact/
│   ├── capture.tsx          # Camera capture screen (existing, enhance)
│   ├── review-badge.tsx     # NEW: Review extracted data screen
│   └── [id].tsx             # Contact detail (existing)
├── components/
│   ├── BadgeCamera.tsx      # NEW: Camera with badge guide overlay
│   ├── ConfidenceIndicator.tsx  # NEW: Shows extraction confidence
│   └── LinkedInSearchButton.tsx # NEW: Opens LinkedIn search
└── services/
    └── badgeOCR.ts          # NEW: API calls to OCR function
```

**Supabase Edge Function:**
```typescript
// supabase/functions/process-badge-photo/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

interface BadgeExtractionResult {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  confidence: {
    firstName: 'high' | 'medium' | 'low' | 'not_found';
    lastName: 'high' | 'medium' | 'low' | 'not_found';
    company: 'high' | 'medium' | 'low' | 'not_found';
    title: 'high' | 'medium' | 'low' | 'not_found';
    email: 'high' | 'medium' | 'low' | 'not_found';
    phone: 'high' | 'medium' | 'low' | 'not_found';
  };
  rawText: string;
}

serve(async (req) => {
  const { imageUrl } = await req.json();

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  });

  // Use Claude's vision capability to analyze the badge
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: BADGE_EXTRACTION_PROMPT, // See Section 2.4.1
          },
        ],
      },
    ],
  });

  // Parse the structured response
  const result = parseExtractionResponse(response);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 2.4.1 Badge Extraction Prompt

```
You are analyzing a conference badge photo to extract contact information.

Analyze the image and extract the following fields. For each field, also
provide a confidence level (high, medium, low, or not_found).

Fields to extract:
1. First Name
2. Last Name
3. Company/Organization
4. Job Title/Role
5. Email Address
6. Phone Number

Respond in this exact JSON format:
{
  "firstName": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "lastName": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "company": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "title": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "email": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "phone": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "rawText": "all visible text on the badge"
}

Confidence guidelines:
- high: Text is clearly visible and unambiguous
- medium: Text is partially visible or could have multiple interpretations
- low: Text is blurry, partially obscured, or uncertain
- not_found: Field not present on badge

Common badge formats to handle:
- Name prominently displayed (usually largest text)
- Company often below or above name
- Title may be smaller text near name
- Email/phone sometimes on badges, often not
- QR codes may be present (ignore)
- Conference name/logo (ignore, not contact info)
```

### 2.5 Database Schema

**No new tables required.** Enhance existing `contacts` table:

```sql
-- Migration: 006_enhance_contacts_for_ocr.sql

-- Add columns for OCR metadata
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS
  ocr_extraction_data JSONB;

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS
  ocr_confidence_score DECIMAL(3,2);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS
  capture_method TEXT CHECK (capture_method IN ('manual', 'badge_scan', 'import'))
  DEFAULT 'manual';

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_contacts_capture_method
  ON public.contacts(capture_method);

COMMENT ON COLUMN public.contacts.ocr_extraction_data IS
  'Raw OCR extraction result including confidence scores';
COMMENT ON COLUMN public.contacts.ocr_confidence_score IS
  'Overall confidence score 0.00-1.00';
COMMENT ON COLUMN public.contacts.capture_method IS
  'How the contact was created: manual entry, badge scan, or import';
```

**Updated Contact Type:**
```typescript
// types/database.ts - Update Contact interface

export interface Contact {
  id: string;
  conference_id: string;
  captured_by: string;
  first_name: string;
  last_name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  badge_photo_url?: string;
  notes?: string;
  follow_up_status: 'none' | 'pending' | 'completed';
  follow_up_date?: string;
  // NEW fields
  ocr_extraction_data?: OCRExtractionData;
  ocr_confidence_score?: number;
  capture_method: 'manual' | 'badge_scan' | 'import';
  created_at: string;
  updated_at: string;
}

export interface OCRExtractionData {
  firstName: { value: string | null; confidence: ConfidenceLevel };
  lastName: { value: string | null; confidence: ConfidenceLevel };
  company: { value: string | null; confidence: ConfidenceLevel };
  title: { value: string | null; confidence: ConfidenceLevel };
  email: { value: string | null; confidence: ConfidenceLevel };
  phone: { value: string | null; confidence: ConfidenceLevel };
  rawText: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';
```

### 2.6 API Design

**Edge Function Endpoint:**
```
POST /functions/v1/process-badge-photo

Request:
{
  "imageUrl": "https://storage.supabase.co/..../badge-123.jpg"
}

Response (Success):
{
  "success": true,
  "data": {
    "firstName": { "value": "John", "confidence": "high" },
    "lastName": { "value": "Smith", "confidence": "high" },
    "company": { "value": "Acme Corporation", "confidence": "high" },
    "title": { "value": "VP of Sales", "confidence": "medium" },
    "email": { "value": "john.smith@acme.com", "confidence": "high" },
    "phone": { "value": null, "confidence": "not_found" },
    "rawText": "LOTF 2026\nJohn Smith\nVP of Sales\nAcme Corporation\njohn.smith@acme.com"
  },
  "processingTimeMs": 2340
}

Response (Error):
{
  "success": false,
  "error": {
    "code": "OCR_FAILED",
    "message": "Could not extract text from image",
    "details": "Image too blurry"
  }
}
```

**Client Service:**
```typescript
// services/badgeOCR.ts

import { supabase } from './supabase';

export interface BadgeScanResult {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  confidence: Record<string, ConfidenceLevel>;
  rawText: string;
}

export async function scanBadge(imageUri: string): Promise<BadgeScanResult> {
  // 1. Upload image to Supabase Storage
  const filename = `badges/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('contact-badges')
    .upload(filename, await fetch(imageUri).then(r => r.blob()));

  if (uploadError) throw uploadError;

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from('contact-badges')
    .getPublicUrl(filename);

  // 3. Call OCR Edge Function
  const { data, error } = await supabase.functions.invoke('process-badge-photo', {
    body: { imageUrl: urlData.publicUrl }
  });

  if (error) throw error;

  return data.data;
}

export function generateLinkedInSearchUrl(
  firstName: string,
  lastName: string,
  company?: string
): string {
  const query = company
    ? `${firstName} ${lastName} ${company}`
    : `${firstName} ${lastName}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}
```

### 2.7 UI/UX Design

#### Camera Screen (`app/contact/capture.tsx`)

```
┌─────────────────────────────────────────┐
│ ←  Capture Badge                    ⚡  │  ← Flash toggle
├─────────────────────────────────────────┤
│                                         │
│                                         │
│      ┌─────────────────────────┐        │
│      │                         │        │
│      │    BADGE ALIGNMENT      │        │  ← Teal colored corners
│      │        GUIDE            │        │     (like slide capture)
│      │                         │        │
│      └─────────────────────────┘        │
│                                         │
│                                         │
│    Position badge within the frame      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│              ┌─────────┐                │
│              │    ◯    │                │  ← Capture button
│              └─────────┘                │
│                                         │
│  [Gallery]              [Batch Mode]    │
└─────────────────────────────────────────┘
```

#### Review Screen (`app/contact/review-badge.tsx`)

```
┌─────────────────────────────────────────┐
│ ←  Review Contact                       │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │      [Badge Photo Thumbnail]      │  │
│  │           (tappable to            │  │
│  │            view full)             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ First Name                        │  │
│  │ [John                      ] ✓    │  │  ← Green check = high
│  ├───────────────────────────────────┤  │
│  │ Last Name                         │  │
│  │ [Smith                     ] ✓    │  │
│  ├───────────────────────────────────┤  │
│  │ Company                           │  │
│  │ [Acme Corporation          ] ✓    │  │
│  ├───────────────────────────────────┤  │
│  │ Title                             │  │
│  │ [VP of Sales               ] ⚠    │  │  ← Yellow = medium
│  ├───────────────────────────────────┤  │
│  │ Email                             │  │
│  │ [john.smith@acme.com       ] ✓    │  │
│  ├───────────────────────────────────┤  │
│  │ Phone                             │  │
│  │ [                          ] ✗    │  │  ← Gray X = not found
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔍 Find on LinkedIn              │  │  ← Opens LinkedIn search
│  └───────────────────────────────────┘  │
│                                         │
│  Quick Note (optional)                  │
│  ┌───────────────────────────────────┐  │
│  │ Met at AI session, interested in  │  │
│  │ our data platform...              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Cancel    │  │  Save Contact   │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

### 2.8 Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Blurry photo | Return error with "Image too blurry, please retake" |
| Non-badge image | Return error with "No badge detected" |
| Multiple badges in frame | Extract from most prominent/centered badge |
| Non-English badge | Claude handles multiple languages well |
| QR code only badge | Return "not_found" for all text fields |
| Handwritten additions | Attempt extraction, mark as low confidence |
| Partial badge (cropped) | Extract what's visible, mark missing as not_found |
| Badge with only name (no company) | Return name fields, others as not_found |
| Very long company names | Truncate at 100 chars with "..." |
| Special characters in names | Preserve Unicode characters |

### 2.9 Implementation Phases

#### Phase 1: Core OCR (3-4 days)
- [ ] Create Supabase Edge Function with Claude Vision integration
- [ ] Implement badge extraction prompt
- [ ] Add response parsing and error handling
- [ ] Create `badgeOCR.ts` client service
- [ ] Test with sample badge images

#### Phase 2: Camera UI (2-3 days)
- [ ] Enhance `capture.tsx` with badge guide overlay
- [ ] Add flash toggle
- [ ] Create `review-badge.tsx` screen
- [ ] Add confidence indicators component
- [ ] Implement field editing

#### Phase 3: Integration (2 days)
- [ ] Connect camera → OCR → review flow
- [ ] Save contact with OCR metadata
- [ ] Add LinkedIn search button
- [ ] Database migration for new columns

#### Phase 4: Polish & Batch Mode (2 days)
- [ ] Add batch scanning mode
- [ ] Optimize for speed (parallel uploads)
- [ ] Error handling and retry logic
- [ ] Loading states and animations

**Total Estimated Time: 9-11 days**

---

## 3. Feature #2: Smart Follow-Up System

### 3.1 Overview

Transform follow-up from a manual, friction-heavy process into an AI-assisted, one-tap workflow.

**Current State:**
- `contacts.follow_up_status` field exists but is just a status flag
- No reminders, templates, or AI assistance
- No tracking of follow-up messages sent

**Target State:**
- AI generates personalized follow-up messages based on contact context
- Scheduled reminders at optimal times (24hr, 1 week, 1 month)
- One-tap to copy message and open LinkedIn/email
- Track follow-up attempts and responses

### 3.2 User Stories

```
US-2.1: As a user, I want AI-generated follow-up message suggestions
        so I can reach out quickly without writer's block.

US-2.2: As a user, I want messages personalized based on my notes and
        sessions attended so the outreach feels genuine.

US-2.3: As a user, I want to choose between message tones (professional,
        casual, brief) so I can match my communication style.

US-2.4: As a user, I want scheduled reminders to follow up so I don't
        forget contacts after the conference.

US-2.5: As a user, I want one-tap to copy message and open LinkedIn
        so the follow-up process is frictionless.

US-2.6: As a user, I want to track which contacts I've followed up with
        and their responses so I can prioritize my efforts.

US-2.7: As a user, I want to see a "Follow-Up Dashboard" after the
        conference showing all pending follow-ups prioritized.
```

### 3.3 User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FOLLOW-UP SYSTEM USER FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   ENTRY POINTS       │
                    └──────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
[Contact Detail]    [Follow-Up Dashboard]    [Push Notification]
"Follow Up" button   Post-conference view    "Time to follow up
                     of all contacts         with John Smith"
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     FOLLOW-UP COMPOSER        │
              │                               │
              │  To: John Smith               │
              │  Company: Acme Corp           │
              │                               │
              │  Context Used:                │
              │  • Notes: "Interested in..."  │
              │  • Session: AI & Data         │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │ Message Style:          │  │
              │  │ [Professional] [Casual] │  │
              │  │ [Brief]                 │  │
              │  └─────────────────────────┘  │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │ Hi John,                │  │
              │  │                         │  │
              │  │ Great meeting you at    │  │
              │  │ Lab of the Future! I    │  │
              │  │ enjoyed our discussion  │  │
              │  │ about AI applications   │  │
              │  │ in pharma data...       │  │
              │  │                         │  │
              │  │ [Regenerate] [Edit]     │  │
              │  └─────────────────────────┘  │
              │                               │
              │  Channel:                     │
              │  [LinkedIn] [Email] [Other]   │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │ 📋 Copy & Open LinkedIn │  │
              │  └─────────────────────────┘  │
              │                               │
              │  Set Reminder:                │
              │  [None] [Tomorrow] [1 Week]   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   AFTER "COPY & OPEN"         │
              │                               │
              │   LinkedIn opens in browser   │
              │   Message copied to clipboard │
              │                               │
              │   App shows confirmation:     │
              │   "Message copied! Paste in   │
              │    LinkedIn to send."         │
              │                               │
              │   [Mark as Sent] [Cancel]     │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   FOLLOW-UP TRACKING          │
              │                               │
              │   Contact updated:            │
              │   • follow_up_status: sent    │
              │   • follow_up_date: today     │
              │   • follow_up_channel: linkedin│
              │   • follow_up_message: [saved]│
              └───────────────────────────────┘
```

### 3.4 Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FOLLOW-UP SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐
│   Mobile     │    │   Supabase   │    │      External Services       │
│   App        │    │   Backend    │    │                              │
└──────────────┘    └──────────────┘    └──────────────────────────────┘
       │                   │                        │
       │ 1. Request        │                        │
       │    follow-up msg  │                        │
       │──────────────────▶│                        │
       │   (contactId,     │                        │
       │    style)         │                        │
       │                   │                        │
       │                   │ 2. Fetch contact,      │
       │                   │    notes, sessions     │
       │                   │    from DB             │
       │                   │                        │
       │                   │ 3. Build context       │
       │                   │    prompt              │
       │                   │                        │
       │                   │ 4. Call Claude API     │
       │                   │───────────────────────▶│
       │                   │◀───────────────────────│ Claude API
       │                   │    Generated message   │
       │                   │                        │
       │ 5. Return         │                        │
       │    message        │                        │
       │◀──────────────────│                        │
       │                   │                        │
       │ 6. User edits,    │                        │
       │    copies msg     │                        │
       │                   │                        │
       │ 7. Open LinkedIn  │                        │
       │    via deep link  │───────────────────────▶│ LinkedIn App/Web
       │                   │                        │
       │ 8. Mark as sent   │                        │
       │──────────────────▶│                        │
       │                   │ 9. Update contact      │
       │                   │    follow_up_status    │
       │                   │                        │
       │                   │ 10. Schedule           │
       │                   │     reminder if set    │
       │                   │───────────────────────▶│ Expo Notifications
```

#### Component Breakdown

**Mobile App Components:**
```
app/
├── contact/
│   ├── [id].tsx              # Contact detail (add follow-up button)
│   └── follow-up.tsx         # NEW: Follow-up composer screen
├── (tabs)/
│   └── follow-ups.tsx        # NEW: Follow-up dashboard tab
├── components/
│   ├── FollowUpComposer.tsx  # NEW: Message generation UI
│   ├── MessageStyleSelector.tsx # NEW: Professional/Casual/Brief
│   └── FollowUpCard.tsx      # NEW: Card for dashboard
└── services/
    └── followUpService.ts    # NEW: API calls for follow-up
```

**Supabase Edge Function:**
```typescript
// supabase/functions/generate-follow-up/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

interface FollowUpRequest {
  contactId: string;
  userId: string;
  style: 'professional' | 'casual' | 'brief';
  channel: 'linkedin' | 'email';
}

serve(async (req) => {
  const { contactId, userId, style, channel } = await req.json() as FollowUpRequest;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Fetch contact details
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  // 2. Fetch user's notes about this contact
  const { data: notes } = await supabase
    .from('contact_notes')
    .select('*')
    .eq('contact_id', contactId);

  // 3. Fetch sessions both attended
  const { data: sharedSessions } = await supabase
    .from('session_attendance')
    .select(`
      sessions (title, speaker_name)
    `)
    .eq('user_id', userId)
    .eq('status', 'attended');

  // 4. Fetch conference name
  const { data: conference } = await supabase
    .from('conferences')
    .select('name')
    .eq('id', contact.conference_id)
    .single();

  // 5. Build context and generate message
  const context = buildFollowUpContext(contact, notes, sharedSessions, conference);

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: buildFollowUpPrompt(context, style, channel),
      },
    ],
  });

  return new Response(JSON.stringify({
    success: true,
    message: response.content[0].text,
    context: context,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 3.5 Database Schema

```sql
-- Migration: 007_follow_up_system.sql

-- Enhance contacts table for follow-up tracking
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS follow_up_channel TEXT
    CHECK (follow_up_channel IN ('linkedin', 'email', 'phone', 'other'));

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS follow_up_message TEXT;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS follow_up_response_status TEXT
    CHECK (follow_up_response_status IN ('pending', 'replied', 'no_response', 'meeting_booked'));

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

-- Create follow-up reminders table
CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('initial', 'follow_up', 'check_in')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(contact_id, user_id, remind_at)
);

-- Create follow-up history table (track all attempts)
CREATE TABLE IF NOT EXISTS public.follow_up_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'email', 'phone', 'other')),
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  response_received BOOLEAN DEFAULT FALSE,
  response_at TIMESTAMPTZ,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_remind_at
  ON public.follow_up_reminders(remind_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user
  ON public.follow_up_reminders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_follow_up_history_contact
  ON public.follow_up_history(contact_id);

CREATE INDEX IF NOT EXISTS idx_contacts_follow_up_status
  ON public.contacts(follow_up_status, follow_up_date);

-- RLS Policies
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders" ON public.follow_up_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own follow-up history" ON public.follow_up_history
  FOR ALL USING (auth.uid() = user_id);
```

**Updated Types:**
```typescript
// types/database.ts - additions

export interface Contact {
  // ... existing fields ...

  // Follow-up enhancements
  follow_up_channel?: 'linkedin' | 'email' | 'phone' | 'other';
  follow_up_message?: string;
  follow_up_sent_at?: string;
  follow_up_response_status?: 'pending' | 'replied' | 'no_response' | 'meeting_booked';
  priority_score?: number;
}

export interface FollowUpReminder {
  id: string;
  contact_id: string;
  user_id: string;
  remind_at: string;
  reminder_type: 'initial' | 'follow_up' | 'check_in';
  status: 'pending' | 'sent' | 'dismissed';
  created_at: string;
}

export interface FollowUpHistory {
  id: string;
  contact_id: string;
  user_id: string;
  channel: 'linkedin' | 'email' | 'phone' | 'other';
  message_content?: string;
  sent_at: string;
  response_received: boolean;
  response_at?: string;
  notes?: string;
}
```

### 3.6 API Design

**Generate Follow-Up Message:**
```
POST /functions/v1/generate-follow-up

Request:
{
  "contactId": "uuid",
  "userId": "uuid",
  "style": "professional" | "casual" | "brief",
  "channel": "linkedin" | "email"
}

Response:
{
  "success": true,
  "message": "Hi John,\n\nGreat meeting you at Lab of the Future...",
  "context": {
    "contactName": "John Smith",
    "company": "Acme Corp",
    "conferenceName": "Lab of the Future 2026",
    "notesUsed": ["Interested in AI applications", "Mentioned budget approval in Q2"],
    "sessionsAttended": ["AI in Pharma", "Data Governance"]
  }
}
```

**Client Service:**
```typescript
// services/followUpService.ts

import { supabase } from './supabase';
import { Linking, Clipboard } from 'react-native';

export type MessageStyle = 'professional' | 'casual' | 'brief';
export type Channel = 'linkedin' | 'email';

export interface GeneratedMessage {
  message: string;
  context: {
    contactName: string;
    company?: string;
    conferenceName: string;
    notesUsed: string[];
    sessionsAttended: string[];
  };
}

export async function generateFollowUpMessage(
  contactId: string,
  userId: string,
  style: MessageStyle,
  channel: Channel
): Promise<GeneratedMessage> {
  const { data, error } = await supabase.functions.invoke('generate-follow-up', {
    body: { contactId, userId, style, channel }
  });

  if (error) throw error;
  return data;
}

export async function copyAndOpenLinkedIn(
  message: string,
  linkedInUrl?: string
): Promise<void> {
  // Copy message to clipboard
  await Clipboard.setString(message);

  // Open LinkedIn profile or search
  const url = linkedInUrl || 'https://www.linkedin.com/messaging/';
  await Linking.openURL(url);
}

export async function copyAndOpenEmail(
  message: string,
  email: string,
  subject: string
): Promise<void> {
  // Copy message to clipboard
  await Clipboard.setString(message);

  // Open email composer
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  await Linking.openURL(mailtoUrl);
}

export async function markFollowUpSent(
  contactId: string,
  userId: string,
  channel: Channel,
  message: string
): Promise<void> {
  // Update contact status
  await supabase
    .from('contacts')
    .update({
      follow_up_status: 'completed',
      follow_up_channel: channel,
      follow_up_message: message,
      follow_up_sent_at: new Date().toISOString(),
      follow_up_response_status: 'pending',
    })
    .eq('id', contactId);

  // Log to history
  await supabase
    .from('follow_up_history')
    .insert({
      contact_id: contactId,
      user_id: userId,
      channel,
      message_content: message,
    });
}

export async function scheduleReminder(
  contactId: string,
  userId: string,
  remindAt: Date,
  reminderType: 'initial' | 'follow_up' | 'check_in'
): Promise<void> {
  await supabase
    .from('follow_up_reminders')
    .insert({
      contact_id: contactId,
      user_id: userId,
      remind_at: remindAt.toISOString(),
      reminder_type: reminderType,
    });
}
```

### 3.7 UI/UX Design

#### Follow-Up Dashboard (`app/(tabs)/follow-ups.tsx`)

```
┌─────────────────────────────────────────┐
│  Follow-Ups                     [Filter]│
├─────────────────────────────────────────┤
│                                         │
│  📊 Post-Conference Summary             │
│  ┌───────────────────────────────────┐  │
│  │  12 contacts captured             │  │
│  │  3 followed up  •  9 pending      │  │
│  │  ████████░░░░░░░░░░░░░  25%       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🔥 Hot Leads (Priority)                │
│  ┌───────────────────────────────────┐  │
│  │ 👤 John Smith                     │  │
│  │    Acme Corp • VP Sales           │  │
│  │    "Interested in Q2 pilot"       │  │
│  │    [Follow Up Now →]              │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Sarah Chen                     │  │
│  │    TechCorp • Director            │  │
│  │    "Budget approved, ready to..." │  │
│  │    [Follow Up Now →]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⏰ Needs Follow-Up (9)                 │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Mike Johnson                   │  │
│  │    DataCo • Manager               │  │
│  │    Captured 2 days ago            │  │
│  │    [Follow Up →]                  │  │
│  └───────────────────────────────────┘  │
│  ... more contacts ...                  │
│                                         │
│  ✅ Completed (3)                       │
│  [Tap to expand]                        │
│                                         │
└─────────────────────────────────────────┘
```

#### Follow-Up Composer (`app/contact/follow-up.tsx`)

```
┌─────────────────────────────────────────┐
│ ←  Follow Up with John                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 John Smith                     │  │
│  │    VP Sales at Acme Corporation   │  │
│  │    📍 Met at: Lab of the Future   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Context from your notes:               │
│  ┌───────────────────────────────────┐  │
│  │ • Interested in AI applications   │  │
│  │ • Mentioned Q2 budget approval    │  │
│  │ • Both attended "AI in Pharma"    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Message Style:                         │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Profes- │ │ Casual │ │ Brief  │       │
│  │sional ✓│ │        │ │        │       │
│  └────────┘ └────────┘ └────────┘       │
│                                         │
│  Generated Message:                     │
│  ┌───────────────────────────────────┐  │
│  │ Hi John,                          │  │
│  │                                   │  │
│  │ Great connecting at Lab of the    │  │
│  │ Future! I really enjoyed our      │  │
│  │ conversation about AI applica-    │  │
│  │ tions in pharma data management.  │  │
│  │                                   │  │
│  │ You mentioned exploring options   │  │
│  │ for Q2 - I'd love to schedule a   │  │
│  │ brief call to discuss how we      │  │
│  │ might help.                       │  │
│  │                                   │  │
│  │ Would next week work for a quick  │  │
│  │ 15-minute chat?                   │  │
│  │                                   │  │
│  │ Best,                             │  │
│  │ [Your name]                       │  │
│  │                                   │  │
│  │ [🔄 Regenerate]  [✏️ Edit]        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Send via:                              │
│  ┌──────────────┐  ┌──────────────┐     │
│  │  🔗 LinkedIn │  │  📧 Email   │     │
│  │     ✓        │  │             │     │
│  └──────────────┘  └──────────────┘     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📋 Copy & Open LinkedIn          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Set reminder if no response:           │
│  [None] [3 days] [1 week ✓] [2 weeks]   │
│                                         │
└─────────────────────────────────────────┘
```

### 3.8 AI Prompt Engineering

#### Follow-Up Message Generation Prompt

```
You are helping a professional write a follow-up message after meeting someone
at a conference. Generate a personalized, authentic message based on the context.

CONTACT INFORMATION:
- Name: {{contact.first_name}} {{contact.last_name}}
- Company: {{contact.company}}
- Title: {{contact.title}}
- Conference: {{conference.name}}

USER'S NOTES ABOUT THIS CONTACT:
{{#each notes}}
- {{this.content}}
{{/each}}

SESSIONS BOTH ATTENDED:
{{#each shared_sessions}}
- {{this.title}} (Speaker: {{this.speaker_name}})
{{/each}}

MESSAGE STYLE: {{style}}
- professional: Formal but warm, focuses on business value
- casual: Friendly and personable, lighter tone
- brief: Short and direct, 2-3 sentences max

CHANNEL: {{channel}}
- linkedin: Appropriate for LinkedIn messaging (no subject line needed)
- email: Include a compelling subject line

GUIDELINES:
1. Reference something specific from the notes or shared sessions
2. Make a clear, low-commitment ask (coffee chat, quick call, etc.)
3. Keep it concise - busy people appreciate brevity
4. Sound human, not templated
5. Don't be pushy or salesy
6. If notes mention specific interests/pain points, reference them

{{#if channel === 'email'}}
RESPOND IN THIS FORMAT:
Subject: [compelling subject line]

[message body]
{{else}}
RESPOND WITH JUST THE MESSAGE (no subject line for LinkedIn)
{{/if}}
```

#### Message Style Examples

**Professional:**
```
Hi John,

Great connecting at Lab of the Future last week. I really enjoyed our
discussion about AI applications in pharmaceutical data management,
particularly your insights on regulatory challenges.

Given your team's Q2 timeline you mentioned, I'd welcome the chance to
explore how our platform might support your initiatives.

Would you have 15 minutes next week for a brief call?

Best regards,
[Name]
```

**Casual:**
```
Hey John!

Really enjoyed chatting at LOTF - that AI session was packed with
great insights, wasn't it?

Your point about the Q2 data project stuck with me. Would love to
grab a virtual coffee and hear more about what you're working on.

Free anytime next week?

Cheers,
[Name]
```

**Brief:**
```
Hi John - Great meeting you at LOTF. Your Q2 data initiative sounds
interesting. Happy to chat if useful - just let me know.
```

### 3.9 Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No notes captured for contact | Generate generic conference follow-up, suggest adding notes |
| No shared sessions | Focus on conference/booth interaction |
| Contact has no email | Default to LinkedIn, hide email option |
| Contact has no LinkedIn | Show email only, suggest adding LinkedIn |
| Very old contact (>30 days) | Adjust message to acknowledge time gap |
| Contact already followed up | Show history, offer "follow-up again" option |
| API rate limit hit | Queue message generation, show loading |
| No internet connection | Save draft locally, sync when online |
| User edits message heavily | Save edited version, not AI version |
| LinkedIn app not installed | Open LinkedIn in browser instead |

### 3.10 Implementation Phases

#### Phase 1: Database & Backend (2-3 days)
- [ ] Create database migration (follow_up_reminders, follow_up_history)
- [ ] Update contacts table with new columns
- [ ] Create Supabase Edge Function for message generation
- [ ] Implement prompt engineering with Claude API
- [ ] Test message generation with various contexts

#### Phase 2: Follow-Up Composer UI (3-4 days)
- [ ] Create `follow-up.tsx` screen
- [ ] Build MessageStyleSelector component
- [ ] Implement message display with edit capability
- [ ] Add "Copy & Open LinkedIn" functionality
- [ ] Add "Copy & Open Email" functionality
- [ ] Implement reminder scheduling

#### Phase 3: Follow-Up Dashboard (2-3 days)
- [ ] Create `follow-ups.tsx` tab
- [ ] Build FollowUpCard component
- [ ] Implement filtering (pending, completed, by date)
- [ ] Add priority scoring display
- [ ] Create summary statistics view

#### Phase 4: Notifications & Polish (2 days)
- [ ] Implement push notification reminders (Expo Notifications)
- [ ] Add notification scheduling service
- [ ] Handle notification tap → open follow-up screen
- [ ] Polish animations and loading states
- [ ] Error handling and offline support

#### Phase 5: Analytics & Iteration (1-2 days)
- [ ] Track follow-up completion rates
- [ ] Track message generation usage
- [ ] A/B test different prompts
- [ ] Gather user feedback on message quality

**Total Estimated Time: 10-14 days**

---

## 4. Shared Infrastructure

### Environment Variables (Supabase)

```env
# Add to Supabase Edge Function secrets
ANTHROPIC_API_KEY=sk-ant-...

# Already configured
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Storage Buckets

```sql
-- Create storage bucket for contact badges (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-badges', 'contact-badges', true)
ON CONFLICT DO NOTHING;

-- Storage policy for badge uploads
CREATE POLICY "Users can upload badges"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-badges');

CREATE POLICY "Anyone can view badges"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-badges');
```

### Shared Types

```typescript
// types/followUp.ts

export interface FollowUpContext {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    title?: string;
    email?: string;
    linkedInUrl?: string;
  };
  conference: {
    name: string;
    startDate: string;
    endDate: string;
  };
  notes: string[];
  sharedSessions: Array<{
    title: string;
    speakerName?: string;
  }>;
  daysSinceConference: number;
}

export interface MessageGenerationOptions {
  style: 'professional' | 'casual' | 'brief';
  channel: 'linkedin' | 'email';
  includeCalendlyLink?: boolean;
  customSignature?: string;
}
```

---

## 5. Security & Privacy Considerations

### Data Handling

1. **Badge Photos:**
   - Store in Supabase Storage with user-scoped paths
   - Delete original after OCR extraction (optional, configurable)
   - Never send to third-party services without consent

2. **Contact Information:**
   - All contact data encrypted at rest (Supabase default)
   - RLS ensures users only access their own contacts
   - Export/delete capability for GDPR compliance

3. **AI Processing:**
   - Use Anthropic's Claude (SOC2 compliant)
   - No training on user data (API usage)
   - Prompts don't include sensitive PII beyond necessary context

### API Security

1. **Edge Functions:**
   - Require authenticated requests
   - Validate user owns the contact being processed
   - Rate limit: 10 OCR requests/minute, 20 message generations/hour

2. **Storage:**
   - Signed URLs for badge uploads
   - Public read for processed images (thumbnails)
   - User-scoped paths prevent enumeration

---

## 6. Testing Strategy

### Unit Tests

```typescript
// __tests__/badgeOCR.test.ts
describe('Badge OCR', () => {
  it('extracts name from clear badge image', async () => {});
  it('handles blurry images gracefully', async () => {});
  it('parses various badge formats', async () => {});
  it('returns confidence scores correctly', async () => {});
});

// __tests__/followUp.test.ts
describe('Follow-Up Generation', () => {
  it('generates professional message', async () => {});
  it('generates casual message', async () => {});
  it('incorporates notes into message', async () => {});
  it('handles missing context gracefully', async () => {});
});
```

### Integration Tests

1. **Badge Scanning Flow:**
   - Upload image → OCR → Review → Save contact
   - Verify all data persisted correctly

2. **Follow-Up Flow:**
   - Generate message → Edit → Copy → Mark sent
   - Verify history recorded, status updated

### Manual Testing Checklist

- [ ] Test with 10+ real conference badges (various formats)
- [ ] Test OCR with different lighting conditions
- [ ] Test follow-up with contacts having varying amounts of notes
- [ ] Test LinkedIn deep linking on iOS and Android
- [ ] Test email deep linking on iOS and Android
- [ ] Test offline behavior for both features
- [ ] Test notification delivery for reminders

---

## 7. Success Metrics

### Badge Scanning

| Metric | Target | Measurement |
|--------|--------|-------------|
| OCR Accuracy | >90% fields correct | Manual review sample |
| Time to capture | <10 seconds | Analytics timestamp |
| Adoption rate | >60% of contacts via scan | capture_method field |
| User satisfaction | >4.0/5 stars | In-app feedback |

### Follow-Up System

| Metric | Target | Measurement |
|--------|--------|-------------|
| Follow-up completion rate | >50% of contacts | follow_up_status |
| Time to follow-up | <48 hours avg | follow_up_sent_at |
| Message edit rate | <30% | Compare generated vs sent |
| Response rate | >20% | follow_up_response_status |

---

## 8. Open Questions

### Badge Scanning

1. **Q: Should we support business card scanning in addition to badges?**
   - Business cards have different layouts, may need separate prompt
   - Decision: Start with badges only, add cards in v2

2. **Q: Should we auto-search LinkedIn and pre-fill URL?**
   - LinkedIn has strict API limits and no official search API
   - Decision: Provide search button that opens LinkedIn with pre-filled query

3. **Q: Store original badge photos or delete after OCR?**
   - Storage cost vs. ability to re-process
   - Decision: Store for 30 days, then archive/delete

### Follow-Up System

1. **Q: Should we support scheduling posts directly to LinkedIn?**
   - LinkedIn API requires partner approval, very restrictive
   - Decision: Copy to clipboard + deep link is the realistic approach

2. **Q: Should AI generate multiple message variations to choose from?**
   - More API cost, but better user choice
   - Decision: Generate one, allow regenerate with different style

3. **Q: How to handle team visibility of follow-up status?**
   - Privacy vs. coordination
   - Decision: Show team members followed up (no message content)

---

## 9. Appendix

### A. Sample Badge Formats

```
Format 1 (Standard horizontal):
┌─────────────────────────────────┐
│ [LOGO]     CONFERENCE 2026      │
│                                 │
│      JOHN SMITH                 │
│      VP of Sales                │
│      Acme Corporation           │
│                                 │
│      john.smith@acme.com        │
└─────────────────────────────────┘

Format 2 (Vertical):
┌───────────────┐
│    [LOGO]     │
│  LOTF 2026    │
│               │
│    JOHN       │
│    SMITH      │
│               │
│   VP Sales    │
│     Acme      │
│               │
│  [QR CODE]    │
└───────────────┘

Format 3 (Minimal):
┌─────────────────────────────────┐
│                                 │
│          John Smith             │
│          Acme Corp              │
│                                 │
└─────────────────────────────────┘
```

### B. LinkedIn Deep Link Reference

```typescript
// Open profile (if URL known)
Linking.openURL('https://www.linkedin.com/in/johnsmith');

// Open messaging (requires login)
Linking.openURL('https://www.linkedin.com/messaging/');

// Open search with pre-filled query
const query = encodeURIComponent('John Smith Acme Corporation');
Linking.openURL(`https://www.linkedin.com/search/results/people/?keywords=${query}`);

// Note: LinkedIn does NOT support pre-filled message text in URLs
// User must paste from clipboard
```

### C. Notification Payload Structure

```typescript
// Expo notification for follow-up reminder
{
  to: expoPushToken,
  title: "Time to follow up!",
  body: "Connect with John Smith from Acme Corp",
  data: {
    type: 'follow_up_reminder',
    contactId: 'uuid',
    screen: 'follow-up',
  },
  sound: 'default',
  badge: 1,
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | Claude | Initial design document |

---

**Next Steps:**
1. Review and approve design document
2. Create JIRA tickets for implementation phases
3. Set up Anthropic API key in Supabase secrets
4. Begin Phase 1 implementation
