# Social Media Campaign Management - Design Document

**Version:** 1.0
**Created:** January 18, 2026
**Status:** Draft
**Author:** Conference Compass Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas & Roles](#3-user-personas--roles)
4. [Feature Specifications](#4-feature-specifications)
5. [Data Model](#5-data-model)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [API Endpoints](#7-api-endpoints)
8. [Implementation Phases](#8-implementation-phases)
9. [LOTF 2026 Campaign Content](#9-lotf-2026-campaign-content)

---

## 1. Overview

### 1.1 Purpose

The Social Media Campaign Management feature enables conference teams to coordinate, execute, and track multi-person social media campaigns around conferences. It transforms the existing spreadsheet-based workflow into an integrated mobile experience.

### 1.2 Problem Statement

Conference teams currently manage social media campaigns using spreadsheets with multiple sheets for different phases, team members, and schedules. This creates several problems:

- **Coordination friction**: Team members must manually check spreadsheets for their assignments
- **Cross-pollination delays**: The "2-hour comment rule" is easy to miss without alerts
- **No real-time visibility**: During conferences, hour-by-hour posting schedules are hard to follow
- **Manual status tracking**: Post status (draft/scheduled/posted) requires manual updates
- **Context loss**: Strategy, roles, and content are scattered across sheets

### 1.3 Solution

A unified campaign management system within Conference Compass that provides:

- **Campaign Dashboard**: Visual overview of the entire campaign
- **Personal Task Views**: Each team member sees their assignments
- **Cross-Pollination Alerts**: Push notifications with countdown timers
- **Conference Mode**: Hour-by-hour real-time schedule during the event
- **Content Library**: Reusable messaging, statistics, and hashtags

### 1.4 Source Data

Primary source: `LOTF/Data_Compass_LOTF_Strategy_v6.xlsx`

Contains 10 sheets:
1. The Strategy - Core framework and role definitions
2. Weeks 1-2 (Agitate) - Pain point posts
3. Weeks 3-4 (Educate) - Solution explanation posts
4. Weeks 5-6 (Hype & Logistics) - Pre-conference excitement
5. Anuj Posts - Individual assignments
6. Ben Posts - Individual assignments
7. Nina Posts - Individual assignments
8. Week 7 (Follow-Up) - Post-conference content
9. Week 6 (Conference Calendar) - Hour-by-hour schedule
10. Carousel (4 Directions) - Educational content asset

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

| Goal | Description |
|------|-------------|
| **Coordination** | Reduce time to coordinate team posts by 80% |
| **Cross-Pollination** | Achieve 95%+ compliance with 2-hour comment rule |
| **Conference Execution** | Enable real-time posting during conference with zero missed slots |
| **Content Consistency** | Maintain consistent messaging across all team members |

### 2.2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cross-pollination completion rate | > 95% | Comments within 2 hours / Total required |
| Posts published on schedule | > 90% | On-time posts / Scheduled posts |
| Team adoption | 100% | Active users / Team members |
| Time to post (conference mode) | < 2 min | Time from event to post published |

---

## 3. User Personas & Roles

### 3.1 Team Member Personas (from LOTF Strategy)

#### Anuj - "The Visionary Architect"
- **Role**: VP, Product Owner
- **Lane**: Strategy, Organizational Risk, "The System is Broken"
- **Tone**: Authoritative, challenging
- **Key Slides**: Asset Maturity vs. Execution Risk (Pg 28)
- **Post Themes**: Big picture, industry challenges, product vision

#### Nina - "The Credible Expert"
- **Role**: PhD Scientist
- **Lane**: Methodology, Evidence, "The How"
- **Tone**: Peer-to-peer, technical, specific
- **Key Slides**: Proxy Problem (Pg 19), Ontology (Pg 12)
- **Post Themes**: Technical deep dives, methodology, scientific sessions

#### Ben - "The Connector"
- **Role**: VP Sales
- **Lane**: Business Value, ROI, Networking
- **Tone**: Energetic, solution-oriented
- **Key Slides**: 70% Failure Rate (Pg 21)
- **Post Themes**: Networking, meetings, ROI, demos

### 3.2 System Roles

| Role | Permissions |
|------|-------------|
| **Campaign Owner** | Full CRUD on all campaign data, invite team members |
| **Team Member** | Edit own posts, view all posts, complete cross-pollination tasks |
| **Viewer** | Read-only access to campaign dashboard |

---

## 4. Feature Specifications

### 4.1 Campaign Dashboard

**Purpose**: Provide at-a-glance visibility into campaign status

**Components**:
- Conference countdown timer
- Current phase indicator (Agitate/Educate/Hype/Conference/Follow-Up)
- This week's post cards (3 columns: one per team member)
- Cross-pollination alert banner
- Quick stats (posts completed, engagement, etc.)

**User Stories**:
- As a team member, I want to see the current campaign phase so I understand the messaging context
- As a team member, I want to see my upcoming posts so I can prepare content
- As a team member, I want to see cross-pollination alerts so I don't miss the 2-hour window

### 4.2 Content Calendar

**Purpose**: Visual timeline of all campaign content

**Views**:
1. **Phase View**: Group posts by campaign phase
2. **Week View**: 7-day calendar with post slots
3. **Person View**: Filter to single team member's posts

**Components**:
- Swimlane calendar (rows = team members, columns = days)
- Post cards with status indicators (Draft/Scheduled/Posted)
- Drag-and-drop rescheduling
- Quick filters by status, owner, phase

**User Stories**:
- As a campaign owner, I want to see all posts in a calendar view so I can identify gaps
- As a team member, I want to filter to my posts so I can focus on my assignments
- As a campaign owner, I want to reschedule posts by dragging so I can adapt to changes

### 4.3 Post Editor

**Purpose**: Create and edit social media posts

**Fields**:
- Owner (team member)
- Week/Day
- Scheduled datetime
- Theme (short title)
- Content (full post text)
- Visual asset description/link
- Platform (LinkedIn, Twitter, etc.)
- Status (Draft/Scheduled/Posted/Skipped)
- Posted URL (after publishing)

**Features**:
- Character count with platform limits
- Content library insert (reusable snippets)
- Hashtag suggestions
- Preview mode (approximate LinkedIn/Twitter rendering)
- Copy to clipboard
- Mark as posted

**User Stories**:
- As a team member, I want to edit my post content so I can refine messaging
- As a team member, I want to copy post text to clipboard so I can paste into LinkedIn
- As a team member, I want to mark a post as posted and add the URL so we can track engagement

### 4.4 Cross-Pollination System

**Purpose**: Enforce the "2-hour comment rule" for team amplification

**Rule Definition** (from strategy):
> "For every post, the other two team members must comment within 2 hours to amplify reach."

**Components**:
1. **Alert System**
   - Push notification when teammate posts
   - Countdown timer showing time remaining
   - List of pending cross-pollination tasks

2. **Task Tracking**
   - Who needs to comment on which post
   - Deadline (2 hours from post time)
   - Completion status
   - Comment URL (proof)

3. **Suggested Comments**
   - AI-generated comment suggestions based on persona
   - Quick-select common responses
   - Custom comment input

**User Stories**:
- As a team member, I want to receive alerts when teammates post so I can comment in time
- As a team member, I want to see a countdown timer so I know how much time I have
- As a team member, I want comment suggestions so I can respond quickly and appropriately

### 4.5 Conference Mode (Week 6)

**Purpose**: Real-time coordination during the conference

**Components**:
1. **Hour-by-Hour Schedule**
   - Timeline view of posting slots
   - Current time indicator
   - Next up highlight

2. **Quick Post**
   - Pre-loaded templates for each slot
   - Photo upload
   - One-tap copy and post

3. **Live Session Reactions**
   - Tag sessions/speakers
   - Quick reaction templates ("Great insight from [Speaker]...")
   - Photo attachment

4. **Contact Capture**
   - Quick-add people met at conference
   - Link to post/interaction
   - Follow-up flag

**Schedule Structure** (from Week 6 Calendar):
- Monday: Travel/Setup (2 posts)
- Tuesday: Day 1 Keynotes (6 posts throughout day)
- Wednesday: Day 2 Sessions (6 posts)
- Thursday: Day 3 Wrap-up (4 posts)
- Friday: Depart/Reflect (2 posts)

**User Stories**:
- As a team member, I want to see the hour-by-hour schedule so I don't miss my posting slots
- As a team member, I want quick templates so I can post live reactions in under 2 minutes
- As a team member, I want to capture contacts with context so I can follow up after the conference

### 4.6 Content Library

**Purpose**: Maintain consistent, reusable messaging elements

**Categories**:
1. **Statistics**
   - "87% of AI projects fail"
   - "70% of data initiatives fail"
   - "190 FDA warning letters for data integrity in FY2024"

2. **Framework Elements**
   - North (Statistical Health) - descriptions
   - East (Semantic Clarity) - descriptions
   - South (Contextual Validity) - descriptions
   - West (Governance & Safety) - descriptions

3. **Hashtags**
   - #LabOfTheFuture / #LotF2026
   - #AIReadiness / #AIReadyData
   - #DataCompass
   - #FAIRData
   - #Ontology

4. **Calls to Action**
   - "DM me if you want to see our readiness scorecard"
   - "Find us at the opening reception"
   - "Book your 15-minute Readiness Audit"

5. **Speaker/Session References**
   - Hans Clevers (Roche) - Rewriting rules
   - Christopher Arendt (Takeda)
   - Nicole Crane (Accenture) - Tech stack vs Talent stack
   - Julia Fox (Takeda) - Semantic Tools
   - Sam Michael (GSK) - Automation

**User Stories**:
- As a team member, I want to insert pre-approved statistics so my posts are accurate
- As a team member, I want quick access to hashtags so I maintain consistency
- As a team member, I want speaker references so I can tag correctly

### 4.7 Analytics Dashboard

**Purpose**: Track campaign performance

**Metrics**:
- Posts by status (Draft/Scheduled/Posted)
- Cross-pollination compliance rate
- Posts per phase
- Posts per team member
- Engagement (if URLs tracked): views, likes, comments

**User Stories**:
- As a campaign owner, I want to see overall campaign progress so I can identify issues
- As a campaign owner, I want to see cross-pollination compliance so I can address gaps

---

## 5. Data Model

### 5.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   conferences   │       │     users       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ team_id (FK)    │       │ email           │
│ name            │       │ full_name       │
│ location        │       │ avatar_url      │
│ start_date      │       └────────┬────────┘
│ end_date        │                │
└────────┬────────┘                │
         │                         │
         │    ┌────────────────────┼────────────────────┐
         │    │                    │                    │
         ▼    ▼                    ▼                    │
┌─────────────────┐       ┌─────────────────┐          │
│campaign_phases  │       │ team_personas   │          │
├─────────────────┤       ├─────────────────┤          │
│ id (PK)         │       │ id (PK)         │          │
│ conference_id   │◄──────│ conference_id   │          │
│ name            │       │ user_id (FK)    │──────────┘
│ week_start      │       │ persona_name    │
│ week_end        │       │ lane            │
│ goal            │       │ tone            │
│ order_index     │       │ key_slides      │
└────────┬────────┘       └─────────────────┘
         │
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│  social_posts   │       │cross_pollination│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ post_id (FK)    │
│ conference_id   │       │ commenter_id    │
│ phase_id (FK)   │       │ required_by     │
│ owner_id (FK)   │       │ completed_at    │
│ week            │       │ comment_url     │
│ day             │       └─────────────────┘
│ scheduled_time  │
│ theme           │       ┌─────────────────┐
│ content         │       │content_library  │
│ visual_asset    │       ├─────────────────┤
│ status          │       │ id (PK)         │
│ platform        │       │ conference_id   │
│ posted_at       │       │ category        │
│ engagement_url  │       │ label           │
└─────────────────┘       │ content         │
                          │ source          │
                          └─────────────────┘

┌─────────────────┐
│conf_schedule    │
├─────────────────┤
│ id (PK)         │
│ conference_id   │
│ day             │
│ time            │
│ owner_id (FK)   │
│ post_type       │
│ content_summary │
│ visual_suggest  │
│ actual_post_id  │
└─────────────────┘
```

### 5.2 Database Schema (SQL)

```sql
-- =====================================================
-- CAMPAIGN PHASES
-- Defines the phases of a social media campaign
-- =====================================================
CREATE TABLE campaign_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 'Agitate', 'Educate', 'Hype', 'Conference', 'Follow-Up'
  description TEXT,
  week_start INT NOT NULL,               -- Starting week number (1-7)
  week_end INT NOT NULL,                 -- Ending week number
  goal TEXT,                             -- Phase objective
  order_index INT NOT NULL DEFAULT 0,    -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM PERSONAS
-- Defines the social media persona for each team member
-- =====================================================
CREATE TABLE team_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL,            -- 'The Visionary Architect'
  lane TEXT,                             -- 'Strategy, Organizational Risk'
  tone TEXT,                             -- 'Authoritative, challenging'
  key_slides TEXT[],                     -- Array of slide references
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conference_id, user_id)
);

-- =====================================================
-- SOCIAL POSTS
-- Individual social media posts in the campaign
-- =====================================================
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES campaign_phases(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scheduling
  week INT NOT NULL,                     -- Week number (1-7)
  day TEXT NOT NULL,                     -- 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  scheduled_time TIMESTAMPTZ,            -- Exact scheduled datetime

  -- Content
  theme TEXT NOT NULL,                   -- Short theme/title: 'The $5M Mistake'
  content TEXT NOT NULL,                 -- Full post text
  visual_asset TEXT,                     -- Description or URL of visual
  platform TEXT DEFAULT 'linkedin',      -- 'linkedin', 'twitter', 'both'

  -- Status tracking
  status TEXT DEFAULT 'draft',           -- 'draft', 'scheduled', 'posted', 'skipped'
  posted_at TIMESTAMPTZ,                 -- When actually posted
  engagement_url TEXT,                   -- URL to the live post

  -- Cross-pollination
  cross_pollination_required BOOLEAN DEFAULT TRUE,
  cross_pollination_window_hours INT DEFAULT 2,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_social_posts_conference ON social_posts(conference_id);
CREATE INDEX idx_social_posts_owner ON social_posts(owner_id);
CREATE INDEX idx_social_posts_week ON social_posts(conference_id, week);
CREATE INDEX idx_social_posts_status ON social_posts(status);

-- =====================================================
-- CROSS-POLLINATION TRACKING
-- Tracks the 2-hour comment requirement
-- =====================================================
CREATE TABLE cross_pollination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  commenter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_by TIMESTAMPTZ NOT NULL,      -- Deadline (post time + 2 hours)
  completed_at TIMESTAMPTZ,              -- When comment was made
  comment_url TEXT,                      -- URL to the comment
  comment_text TEXT,                     -- Text of the comment (optional)
  status TEXT DEFAULT 'pending',         -- 'pending', 'completed', 'missed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, commenter_id)
);

-- Index for pending tasks
CREATE INDEX idx_cross_pollination_pending ON cross_pollination(commenter_id, status)
  WHERE status = 'pending';

-- =====================================================
-- CONTENT LIBRARY
-- Reusable content snippets
-- =====================================================
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                -- 'statistic', 'framework', 'hashtag', 'cta', 'speaker'
  label TEXT NOT NULL,                   -- Short identifier
  content TEXT NOT NULL,                 -- The actual content
  source TEXT,                           -- Where this came from (slide reference, etc.)
  usage_count INT DEFAULT 0,             -- Track how often used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_library_category ON content_library(conference_id, category);

-- =====================================================
-- CONFERENCE SCHEDULE (Hour-by-Hour)
-- Detailed posting schedule for conference week
-- =====================================================
CREATE TABLE conference_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  schedule_day DATE NOT NULL,            -- The calendar date
  schedule_time TIME NOT NULL,           -- Time of day
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL,               -- 'Arrival', 'Preview', 'Live Reaction', 'Session Highlight', etc.
  content_summary TEXT,                  -- Brief description of expected content
  visual_suggestion TEXT,                -- Suggested visual asset
  actual_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conference_schedule_day ON conference_schedule(conference_id, schedule_day);

-- =====================================================
-- CAMPAIGN CONTACTS
-- People met during the conference
-- =====================================================
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  captured_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  linkedin_url TEXT,
  email TEXT,
  notes TEXT,
  interaction_type TEXT,                 -- 'booth', 'session', 'networking', 'demo_request'
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  source_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_contacts_conference ON campaign_contacts(conference_id);
CREATE INDEX idx_campaign_contacts_follow_up ON campaign_contacts(conference_id, follow_up_required)
  WHERE follow_up_required = TRUE AND follow_up_completed = FALSE;
```

### 5.3 TypeScript Types

```typescript
// types/campaign.ts

export interface CampaignPhase {
  id: string;
  conference_id: string;
  name: 'Agitate' | 'Educate' | 'Hype' | 'Conference' | 'Follow-Up';
  description?: string;
  week_start: number;
  week_end: number;
  goal?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TeamPersona {
  id: string;
  conference_id: string;
  user_id: string;
  persona_name: string;
  lane?: string;
  tone?: string;
  key_slides?: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'skipped';
export type PostPlatform = 'linkedin' | 'twitter' | 'both';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface SocialPost {
  id: string;
  conference_id: string;
  phase_id?: string;
  owner_id: string;
  week: number;
  day: DayOfWeek;
  scheduled_time?: string;
  theme: string;
  content: string;
  visual_asset?: string;
  platform: PostPlatform;
  status: PostStatus;
  posted_at?: string;
  engagement_url?: string;
  cross_pollination_required: boolean;
  cross_pollination_window_hours: number;
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  phase?: CampaignPhase;
  cross_pollination_tasks?: CrossPollinationTask[];
}

export type CrossPollinationStatus = 'pending' | 'completed' | 'missed';

export interface CrossPollinationTask {
  id: string;
  post_id: string;
  commenter_id: string;
  required_by: string;
  completed_at?: string;
  comment_url?: string;
  comment_text?: string;
  status: CrossPollinationStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  commenter?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  post?: SocialPost;
}

export type ContentCategory = 'statistic' | 'framework' | 'hashtag' | 'cta' | 'speaker';

export interface ContentLibraryItem {
  id: string;
  conference_id: string;
  category: ContentCategory;
  label: string;
  content: string;
  source?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConferenceScheduleSlot {
  id: string;
  conference_id: string;
  schedule_day: string;
  schedule_time: string;
  owner_id?: string;
  post_type: string;
  content_summary?: string;
  visual_suggestion?: string;
  actual_post_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: {
    id: string;
    full_name: string;
  };
  actual_post?: SocialPost;
}

export interface CampaignContact {
  id: string;
  conference_id: string;
  captured_by: string;
  name: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  notes?: string;
  interaction_type?: 'booth' | 'session' | 'networking' | 'demo_request';
  follow_up_required: boolean;
  follow_up_completed: boolean;
  source_post_id?: string;
  created_at: string;
  updated_at: string;
}

// Aggregate types for views
export interface WeeklyCalendarView {
  week: number;
  phase: CampaignPhase;
  posts_by_day: Record<DayOfWeek, SocialPost[]>;
  posts_by_owner: Record<string, SocialPost[]>;
}

export interface CampaignDashboardData {
  conference: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  days_until_conference: number;
  current_phase: CampaignPhase;
  current_week: number;
  stats: {
    total_posts: number;
    posts_by_status: Record<PostStatus, number>;
    cross_pollination_compliance: number;
  };
  this_week_posts: SocialPost[];
  pending_cross_pollination: CrossPollinationTask[];
}
```

---

## 6. UI/UX Specifications

### 6.1 Navigation Structure

```
📱 Conference Compass App
├── 🏠 Home (Conference Selector)
├── 📅 Sessions (existing)
├── 👥 Contacts (existing)
├── 📊 Campaign (NEW)
│   ├── Dashboard
│   ├── Calendar
│   ├── My Posts
│   ├── Cross-Pollination
│   ├── Content Library
│   └── Conference Mode (Week 6)
└── ⚙️ Settings
```

### 6.2 Screen Specifications

#### 6.2.1 Campaign Dashboard

**Layout**: Single scroll view with cards

```
┌─────────────────────────────────────┐
│ 🧭 LOTF 2026 Campaign               │
│ 📅 12 days until conference         │
├─────────────────────────────────────┤
│ CURRENT PHASE                       │
│ ┌─────────────────────────────────┐ │
│ │ 📢 EDUCATE (Weeks 3-4)          │ │
│ │ Goal: Explain the solution      │ │
│ │ ████████░░ 65% complete         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🔔 CROSS-POLLINATION ALERTS         │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Nina's post needs comment    │ │
│ │    1h 42m remaining             │ │
│ │    [View Post] [Comment Now]    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ THIS WEEK'S POSTS                   │
│ ┌─────────┬─────────┬─────────┐    │
│ │ ANUJ    │ NINA    │ BEN     │    │
│ │ ──────  │ ──────  │ ──────  │    │
│ │ Tue     │ Wed     │ Thu     │    │
│ │ 4 Dims  │ Semantic│ Exec    │    │
│ │ ✅Posted│ 🟡Draft │ ⏳Next  │    │
│ └─────────┴─────────┴─────────┘    │
├─────────────────────────────────────┤
│ QUICK STATS                         │
│ Posts: 12/24  │  X-Poll: 95%       │
└─────────────────────────────────────┘
```

**Components**:
- `CampaignHeader`: Conference name + countdown
- `PhaseCard`: Current phase with progress
- `CrossPollinationAlerts`: Pending tasks with countdown
- `WeeklyPostGrid`: 3-column grid of this week's posts
- `QuickStats`: Key metrics row

#### 6.2.2 Content Calendar

**Layout**: Horizontal scrollable calendar

```
┌─────────────────────────────────────┐
│ 📅 Content Calendar      [Filter ▼] │
├─────────────────────────────────────┤
│ ◀ Week 3 (Educate)              ▶   │
├─────────────────────────────────────┤
│     Mon  Tue  Wed  Thu  Fri  Sat    │
│ ────────────────────────────────    │
│ Anuj  -  [█]   -   -    -    -      │
│ Nina  -   -   [█]  -    -    -      │
│ Ben   -   -    -  [█]   -    -      │
├─────────────────────────────────────┤
│ [█] = Post card (tap to view/edit)  │
└─────────────────────────────────────┘
```

**Interactions**:
- Swipe left/right to change weeks
- Tap post card to open editor
- Long-press to drag and reschedule
- Filter dropdown: All / My Posts / By Status

#### 6.2.3 Post Editor

**Layout**: Form with preview

```
┌─────────────────────────────────────┐
│ ← Edit Post                  [Save] │
├─────────────────────────────────────┤
│ Status: [Draft ▼]                   │
│                                     │
│ Owner: [Anuj ▼]                     │
│ Week: [3 ▼]  Day: [Tue ▼]          │
│                                     │
│ Theme                               │
│ ┌─────────────────────────────────┐ │
│ │ The 4 Dimensions                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Content                    [📚 Lib] │
│ ┌─────────────────────────────────┐ │
│ │ We need a compass for AI        │ │
│ │ readiness.                      │ │
│ │                                 │ │
│ │ North: Statistical Health       │ │
│ │ East: Semantic Clarity          │ │
│ │ South: Contextual Validity      │ │
│ │ West: Governance & Safety       │ │
│ │                                 │ │
│ │ Which direction is your org     │ │
│ │ ignoring? #AIReadiness          │ │
│ └─────────────────────────────────┘ │
│                         287/3000 📘 │
│                                     │
│ Visual Asset                        │
│ ┌─────────────────────────────────┐ │
│ │ Slide: 4 Dimensions Compass     │ │
│ │ (Page 3)                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Preview] [Copy Text] [Posted?] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Actions**:
- `[📚 Lib]`: Open content library to insert snippet
- `[Preview]`: Show approximate LinkedIn rendering
- `[Copy Text]`: Copy content to clipboard
- `[Posted?]`: Mark as posted and add URL

#### 6.2.4 Cross-Pollination Hub

**Layout**: Task list with countdown timers

```
┌─────────────────────────────────────┐
│ 🔔 Cross-Pollination                │
├─────────────────────────────────────┤
│ PENDING (2)                         │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 Nina's "Semantic Clarity"    │ │
│ │    Posted: 18m ago              │ │
│ │    ⏱️ 1h 42m remaining          │ │
│ │                                 │ │
│ │ Suggested comment:              │ │
│ │ "Great point on East! This is   │ │
│ │  why our ontology mapping..."   │ │
│ │                                 │ │
│ │ [View Post] [Mark Complete]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Ben's "Execution Risk"       │ │
│ │    Posted: 1h 12m ago           │ │
│ │    ⏱️ 48m remaining             │ │
│ │    [View Post] [Mark Complete]  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ COMPLETED TODAY (3)                 │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Anuj's "4 Dimensions"        │ │
│ │    Commented: 45m after post    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 6.2.5 Conference Mode

**Layout**: Hour-by-hour timeline

```
┌─────────────────────────────────────┐
│ 🎯 CONFERENCE MODE                  │
│ Tuesday, Day 1 - Keynotes           │
├─────────────────────────────────────┤
│ NOW ────────────────────────────    │
│                                     │
│ 10:30am ✅ DONE                     │
│ ┌─────────────────────────────────┐ │
│ │ Anuj - Live Reaction            │ │
│ │ Nicole Crane Tech/Talent slide  │ │
│ │ [View Post]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 12:00pm 🔴 NOW                      │
│ ┌─────────────────────────────────┐ │
│ │ Nina - Session Highlight        │ │
│ │ Hans Clevers: Proxy Problem     │ │
│ │                                 │ │
│ │ [Quick Post] [Skip]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 2:00pm ⏳ UPCOMING                  │
│ ┌─────────────────────────────────┐ │
│ │ Ben - Booth/Networking          │ │
│ │ Booth is live, great convos...  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 5:00pm ⏳ UPCOMING                  │
│ ┌─────────────────────────────────┐ │
│ │ Nina - Technical Session        │ │
│ │ Amrik Mahal & Hebe Middlemiss   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Quick Post Flow**:
1. Tap [Quick Post]
2. Pre-loaded template appears
3. Edit if needed
4. Add photo (optional)
5. [Copy & Post] - copies to clipboard
6. After posting on LinkedIn, tap [Done] and paste URL

### 6.3 Color Coding

| Element | Color | Hex |
|---------|-------|-----|
| Agitate Phase | Red | #EF4444 |
| Educate Phase | Blue | #3B82F6 |
| Hype Phase | Yellow | #F59E0B |
| Conference Phase | Green | #10B981 |
| Follow-Up Phase | Purple | #8B5CF6 |
| Draft Status | Gray | #6B7280 |
| Scheduled Status | Blue | #3B82F6 |
| Posted Status | Green | #10B981 |
| Missed/Skipped | Red | #EF4444 |
| Urgent Alert | Red | #EF4444 |
| Warning Alert | Yellow | #F59E0B |

### 6.4 Push Notifications

| Trigger | Title | Body | Priority |
|---------|-------|------|----------|
| Teammate posts | "🔔 {Name} just posted" | "{Theme} - Comment within 2 hours!" | High |
| 30 min warning | "⚠️ 30 minutes left!" | "Comment on {Name}'s post: {Theme}" | High |
| Missed deadline | "❌ Missed cross-pollination" | "You missed the window for {Name}'s post" | Normal |
| Your post is due | "📝 Time to post!" | "{Theme} is scheduled for now" | High |
| Conference slot | "🎯 Conference Mode" | "{Time}: {PostType} - {Summary}" | High |

---

## 7. API Endpoints

### 7.1 Campaign Phases

```
GET    /api/conferences/:conferenceId/campaign/phases
POST   /api/conferences/:conferenceId/campaign/phases
GET    /api/conferences/:conferenceId/campaign/phases/:phaseId
PUT    /api/conferences/:conferenceId/campaign/phases/:phaseId
DELETE /api/conferences/:conferenceId/campaign/phases/:phaseId
```

### 7.2 Social Posts

```
GET    /api/conferences/:conferenceId/campaign/posts
       Query params: ?week=3&owner=userId&status=draft&phase=phaseId
POST   /api/conferences/:conferenceId/campaign/posts
GET    /api/conferences/:conferenceId/campaign/posts/:postId
PUT    /api/conferences/:conferenceId/campaign/posts/:postId
DELETE /api/conferences/:conferenceId/campaign/posts/:postId
POST   /api/conferences/:conferenceId/campaign/posts/:postId/mark-posted
       Body: { engagement_url: string }
```

### 7.3 Cross-Pollination

```
GET    /api/conferences/:conferenceId/campaign/cross-pollination
       Query params: ?status=pending&commenter=userId
GET    /api/conferences/:conferenceId/campaign/cross-pollination/my-tasks
POST   /api/conferences/:conferenceId/campaign/cross-pollination/:taskId/complete
       Body: { comment_url?: string, comment_text?: string }
```

### 7.4 Content Library

```
GET    /api/conferences/:conferenceId/campaign/content-library
       Query params: ?category=statistic
POST   /api/conferences/:conferenceId/campaign/content-library
PUT    /api/conferences/:conferenceId/campaign/content-library/:itemId
DELETE /api/conferences/:conferenceId/campaign/content-library/:itemId
POST   /api/conferences/:conferenceId/campaign/content-library/:itemId/use
       (Increments usage_count)
```

### 7.5 Conference Schedule

```
GET    /api/conferences/:conferenceId/campaign/schedule
       Query params: ?day=2026-03-10
GET    /api/conferences/:conferenceId/campaign/schedule/today
POST   /api/conferences/:conferenceId/campaign/schedule/:slotId/link-post
       Body: { post_id: string }
```

### 7.6 Team Personas

```
GET    /api/conferences/:conferenceId/campaign/personas
POST   /api/conferences/:conferenceId/campaign/personas
PUT    /api/conferences/:conferenceId/campaign/personas/:personaId
```

### 7.7 Dashboard

```
GET    /api/conferences/:conferenceId/campaign/dashboard
       Returns: CampaignDashboardData
```

---

## 8. Implementation Phases

### Phase 1: Data Foundation (Week 1)
**Goal**: Database schema and data import

- [ ] Create database migrations for all tables
- [ ] Implement TypeScript types
- [ ] Build data import script for LOTF spreadsheet
- [ ] Create Supabase RLS policies
- [ ] Write unit tests for data layer

**Deliverables**:
- All tables created in Supabase
- LOTF 2026 data imported
- Types exported from `types/campaign.ts`

### Phase 2: Core CRUD & Hooks (Week 1-2)
**Goal**: Basic data operations

- [ ] Create `useCampaign` hook (phases, stats)
- [ ] Create `useSocialPosts` hook (CRUD)
- [ ] Create `useCrossPollination` hook
- [ ] Create `useContentLibrary` hook
- [ ] Create `useConferenceSchedule` hook
- [ ] Write integration tests

**Deliverables**:
- All hooks functional
- Can create/read/update/delete posts
- Can mark cross-pollination complete

### Phase 3: Campaign Dashboard (Week 2)
**Goal**: Main dashboard screen

- [ ] Build `CampaignDashboard` screen
- [ ] Build `PhaseCard` component
- [ ] Build `WeeklyPostGrid` component
- [ ] Build `CrossPollinationAlerts` component
- [ ] Add to app navigation

**Deliverables**:
- Dashboard accessible from main nav
- Shows current phase, week's posts, alerts

### Phase 4: Post Management (Week 2-3)
**Goal**: Create and edit posts

- [ ] Build `ContentCalendar` screen
- [ ] Build `PostEditor` screen
- [ ] Build `PostCard` component
- [ ] Implement content library insert
- [ ] Add copy-to-clipboard
- [ ] Add mark-as-posted flow

**Deliverables**:
- Can view calendar of all posts
- Can edit posts
- Can copy text and mark posted

### Phase 5: Cross-Pollination (Week 3)
**Goal**: Enforce the 2-hour rule

- [ ] Build `CrossPollinationHub` screen
- [ ] Implement countdown timer
- [ ] Add push notifications
- [ ] Build comment suggestions (optional AI)
- [ ] Track completion rates

**Deliverables**:
- Alerts appear when teammate posts
- Can mark tasks complete
- Notifications working

### Phase 6: Conference Mode (Week 3-4)
**Goal**: Real-time conference support

- [ ] Build `ConferenceModeScreen`
- [ ] Build hour-by-hour timeline
- [ ] Build quick-post flow
- [ ] Add photo attachment
- [ ] Link schedule slots to posts

**Deliverables**:
- Hour-by-hour view for conference days
- Quick post from schedule slot
- Can attach photos

### Phase 7: Polish & Analytics (Week 4)
**Goal**: Final touches

- [ ] Build analytics dashboard
- [ ] Add engagement tracking
- [ ] Performance optimization
- [ ] Error handling
- [ ] User testing

**Deliverables**:
- Analytics visible
- App performant
- Ready for LOTF 2026

---

## 9. LOTF 2026 Campaign Content

### 9.1 Campaign Strategy

**Core Theme**: Clean ≠ Ready. Moving beyond 'clean data' to 'AI-ready data'.

**The Framework** (4 Cardinal Dimensions):
- **North**: Statistical Health - Can the data learn?
- **East**: Semantic Clarity - Can AI reason with it?
- **South**: Contextual Validity - Is it measuring the right thing?
- **West**: Governance & Safety - Is it safe and compliant?

**Event**: Lab of the Future (LotF) 2026 - Boston, MA

**Launch Approach**: Integrated - Merge product launch with conference promotion. Build in public.

**Cross-Pollination Rule**: For every post, the other two team members must comment within 2 hours to amplify reach.

### 9.2 Team Personas

#### Anuj - "The Visionary Architect"
- **Role**: VP, Product Owner
- **Lane**: Strategy, Organizational Risk, "The System is Broken"
- **Tone**: Authoritative, challenging
- **Key Slides**: Asset Maturity vs. Execution Risk (Pg 28)

#### Nina - "The Credible Expert"
- **Role**: PhD Scientist
- **Lane**: Methodology, Evidence, "The How"
- **Tone**: Peer-to-peer, technical, specific
- **Key Slides**: Proxy Problem (Pg 19), Ontology (Pg 12)

#### Ben - "The Connector"
- **Role**: VP Sales
- **Lane**: Business Value, ROI, Networking
- **Tone**: Energetic, solution-oriented
- **Key Slides**: 70% Failure Rate (Pg 21)

### 9.3 Campaign Phases

| Phase | Weeks | Goal | Post Count |
|-------|-------|------|------------|
| Agitate | 1-2 | Stir up pain points | 6 |
| Educate | 3-4 | Explain the solution | 6 |
| Hype & Logistics | 5-6 | Build excitement | 5 |
| Conference | 6 | Real-time coverage | ~20 |
| Follow-Up | 7 | Convert connections | 9 |

### 9.4 All Posts Content

#### Weeks 1-2: Agitate Phase

**Week 1, Tuesday - Anuj - "The $5M Mistake"**
```
We spend millions on 'Clean Data'—no duplicates, right formats. Yet 87% of AI projects fail. Why? Because Clean ≠ Ready. Clean is a spreadsheet. Ready is a Compass. We need to navigate 4 dimensions, not just one. If you're going to #LabOfTheFuture, ask yourself: is your data ready, or just clean?
```
Visual: Text Only

**Week 1, Wednesday - Nina - "The Proxy Problem"**
```
I'm prepping for #LotF2026 and thinking about Hans Clevers' upcoming talk on rewriting rules. One rule we must break: using demographic proxies for biology. This is South (Contextual Validity) on the Data Compass—and it's the most ignored direction. If you aren't looking South, you aren't predicting biology; you're predicting healthcare access.
```
Visual: Slide: The Proxy Problem (Page 19)

**Week 1, Thursday - Ben - "The Networking Hook"**
```
Reviewing the #LotF2026 agenda. Huge lineup from Takeda and Roche. I'm looking to speak with leaders who are tired of their AI pilots stalling because they lack a navigation system for their data. Who is going to be in Boston?
```
Visual: Photo of Conference Agenda

**Week 2, Tuesday - Anuj - "Asset vs. Execution"**
```
Most failures I see happen in the top-left quadrant: High Asset Maturity (great data), Low Execution Readiness (resistant teams). We need to measure both. Excited to discuss the full equation in Boston.
```
Visual: Slide: Asset vs Execution Matrix (Page 28)

**Week 2, Wednesday - Nina - "Ontology & Silos"**
```
Automation is useless if the robots don't speak the same language. If you're attending Sam Michael's (GSK) session on automation, ask: Are we building data silos at high speed? We need East (Semantic Clarity) to fix this. #FAIRData #Ontology
```
Visual: Slide: Ontology Management (Page 14)

**Week 2, Thursday - Ben - "Table Stakes Rant"**
```
Unpopular opinion: 'Data Governance' has become a boring compliance checkbox. It needs to be an engineering constraint. This is West (Governance) on our compass—it protects the whole journey. If you want to see what active governance looks like, find me at #LotF.
```
Visual: Text Only

#### Weeks 3-4: Educate Phase

**Week 3, Tuesday - Anuj - "The 4 Dimensions"**
```
We need a compass for AI readiness. North: Statistical Health. East: Semantic Clarity. South: Contextual Validity. West: Governance & Safety. Which direction is your organization ignoring? #AIReadiness
```
Visual: Slide: 4 Dimensions Compass (Page 3)

**Week 3, Wednesday - Nina - "Semantic Clarity"**
```
Looking forward to Julia Fox's (Takeda) talk on Semantic Tools. We can't have AI 'reason' if data lacks definitions. This is East on the Compass. Level 1 is a match. Level 3 is inference. Where is your lab?
```
Visual: Slide: ML-Hybrid Ontology (Page 13)

**Week 3, Thursday - Ben - "Execution Risk"**
```
70% of data initiatives fail. It's usually people, not tech. I'm heading to Boston to talk about the 'Execution' side of the equation. DM me if you want to see our readiness scorecard.
```
Visual: Slide: 70% Failure Stat (Page 21)

**Week 4, Tuesday - Anuj - "Soft Launch"**
```
We've been working on something that automates the 'Ready' assessment across all 4 dimensions. It's called Data Compass. We'll be demoing how it solves the Proxy Problem live in Boston. #DataCompass #Launch
```
Visual: Image: Product Logo/Teaser

**Week 4, Wednesday - Nina - "Automating Fairness"**
```
Humans can't check millions of rows for bias. Algorithms can. I'll be showing how we calculate Shannon entropy for demographic representation (that's North (Statistical Health) on the Data Compass, specifically the Bias Risk component of ML Readiness) on the fly. Catch me after Yves Fomekong Nanfack's session.
```
Visual: Slide: Bias Assessment Dashboard (Page 6)

**Week 4, Thursday - Ben - "Calendar Drop"**
```
My calendar for Boston is filling up. I have 4 slots left for anyone who wants a 15-minute 'Readiness Audit' of their current strategy. First come, first served.
```
Visual: Calendly link needed

#### Weeks 5-6: Hype & Logistics Phase

**Week 5, Tuesday - Anuj - "The Challenge"**
```
I challenge every speaker at #LotF to answer one question: How do you measure North (Statistical Health)? Is your data learning-ready, or just filled out? Looking at you Christopher Arendt and Amrik Mahal—can't wait to hear your take!
```
Visual: Tagged Speaker Photos

**Week 5, Wednesday - Nina - "Science Deep Dive"**
```
I'm bringing our full ontology mapping demo to Boston. If you want to see how we map raw instrument data to HGNC/UniProt automatically, find me. It's magic for data scientists.
```
Visual: Video Snippet: Ontology Mapping

**Week 5, Thursday - Ben - "See You There"**
```
Bags are packed (almost). The team (Anuj, Nina, and I) is bringing a new standard for AI Readiness to Boston. If you care about ROI on your data, let's grab coffee.
```
Visual: Team Photo

**Week 6, Monday - All - "On The Ground"**
```
The Data Compass team is here in Boston! We're ready to move Beyond Clean. Find us at the opening reception.
```
Visual: Selfie at Venue

**Week 6, Wednesday - Anuj - "Live Reaction"**
```
Slide from Nicole Crane confirms it: Tech stack and Talent stack are misaligned. This is exactly why we built the Execution Readiness score.
```
Visual: Photo of Keynote Slide

#### Week 7: Follow-Up Phase

**Monday - Anuj - "The Reflection Post"**
```
Back from #LotF2026 and still processing. The theme I heard in nearly every conversation: "We have the data. We have the AI tools. We don't have confidence they'll work together."

Three things I'll be thinking about for weeks:
1) The gap between "clean" and "ready" is wider than most orgs realize
2) Organizational readiness fails more projects than technical debt
3) The industry is hungry for a standard—not another dashboard.

Thank you to everyone who stopped by our demo. If we connected in Boston and I owe you a follow-up—it's coming this week. #AIReadyData #DataCompass
```
Visual: Team photo at conference

**Monday - Nina - "The Science Standout"**
```
The session that will stick with me from #LotF2026: Julia Fox's talk on Semantic Tools for Drug Discovery.

She articulated something I've been saying for years: you can't build AI that "reasons" if your data doesn't have definitions.

This is East on the Data Compass—Semantic Clarity. Most orgs treat ontology mapping as a nice-to-have. It's actually the difference between AI that correlates and AI that understands.

If you're working on semantic infrastructure for life sciences data, I'd love to connect. #FAIRData #Ontology #LotF2026
```
Visual: Julia Fox session photo or Ontology slide (Page 13-14)

**Monday - Ben - "Connector Gratitude"**
```
31 conversations. 14 demo requests. 1 incredible week.

Thank you to everyone who made time for us at #LotF2026.

What struck me most: the hunger for a clear answer to "is our data actually AI-ready?" Not "is it clean?" Not "is it cataloged?" But: "Can we confidently build on this?"

If we spoke in Boston and you want that 15-minute Readiness Audit we discussed—my calendar is open. Link in comments.

To the Data Compass team (Anuj, Nina)—proud to build this with you. #DataCompass #AIReadyData
```
Visual: Networking collage or booth photo

**Wednesday - Anuj - "Insight Thread (5 Learnings)"**
```
5 things I learned at #LotF2026:
1) The "Tech Stack vs Talent Stack" gap is real (Nicole Crane nailed it)
2) Autonomous labs need autonomous quality control (Petrina Kamya's vision)
3) CMC is the next frontier for AI readiness
4) Semantic interoperability is non-negotiable
5) The industry wants a standard, not another tool.

We're listening. More to share soon. What was your biggest takeaway? #LotF2026
```
Visual: 5 Learnings graphic

**Wednesday - Nina - "Technical Deep Dive"**
```
At #LotF2026, I got the question I was hoping for: "How do you actually measure if data is ML-ready? What's the math?"

Short version:
- Data Sufficiency (Factor 50 Rule, power analysis, class balance)
- Bias Risk (Shannon entropy, CDD divergence, proxy detection)
- Feature Quality (Theil's U, R-value, VIF)

This isn't a black box. It's peer-reviewed methodology (AIDRIN framework, SSDBM 2024).

DM me for the full technical breakdown. #MLReadiness #DataScience #AIReadyData
```
Visual: Slide 40 (ML Readiness Assessment)

**Wednesday - Ben - "Pipeline Post"**
```
Post-conference reality check:

We came to #LotF2026 with a hypothesis: "Leaders know they have a data readiness problem but don't have a way to measure it."

Validated.

Now scheduling deep-dive sessions with teams from:
- 3 top-10 pharma companies
- 2 AI-native drug discovery platforms
- 1 major CRO

If your organization is tired of AI pilots that stall at the data stage, we should talk.

Complimentary "Readiness Audits" through end of Q1. One dataset. Four dimensions. Full assessment. #DataCompass #AIReadyData
```
Visual: Complimentary Readiness Audit graphic

**Friday - Anuj - "Challenge Recap"**
```
Before #LotF2026, I challenged speakers to answer: "How do you measure Statistical Health (North)?"

Here's what I heard:
- Some orgs measure it manually, per project, without standardization
- Many measure Data Quality but NOT ML Readiness
- Almost no one has a portfolio-level view

The gap is clear. The opportunity is massive.

To Christopher Arendt, Amrik Mahal, and everyone who engaged: thank you. Your answers are shaping our roadmap. #LotF2026 #DataCompass #AIReadyData
```
Visual: Challenge question graphic

**Friday - Nina - "Community Builder"**
```
One of the best parts of #LotF2026: finding my people.

Data scientists and informaticians who care about:
- FAIR principles beyond checkboxes
- Ontology infrastructure that actually works
- Bias detection before it becomes a regulatory problem
- Making AI trustworthy not just powerful

I'm starting a monthly "AI Readiness" virtual coffee chat.
First session: February.
Topic: "Measuring Semantic Interoperability—What Works and What Doesn't."

Comment "interested" if you want an invite. #FAIRData #DataScience #AIReadyData
```
Visual: AI Readiness Coffee Chat graphic

**Friday - Ben - "CTA Close"**
```
Last call from #LotF2026:

If we spoke in Boston and you're still deciding whether to book that demo—here's what you'll see:
- A real assessment of YOUR data (not canned demo)
- Scores across all 4 dimensions
- Prioritized recommendations with effort estimates
- Audit-ready documentation

Time: 30 minutes.
Outcome: You'll know exactly where your AI readiness gaps are.

No pitch. No pressure. Just clarity.

Book here: [Calendly Link]

Thanks again, Boston. Until next time. #DataCompass #AIReadyData #LotF2026
```
Visual: Product dashboard screenshot

### 9.5 Conference Week Schedule (Week 6)

#### Monday (Travel/Setup)
| Time | Owner | Type | Content |
|------|-------|------|---------|
| 10am | All (Anuj) | Arrival | Team landed in Boston. Ready to move Beyond Clean. |
| 4pm | Ben | Logistics | Networking reception tip |

#### Tuesday (Day 1 - Keynotes)
| Time | Owner | Type | Content |
|------|-------|------|---------|
| 8am | Anuj | Preview | Keynotes lineup: Hans Clevers, Christopher Arendt, Nicole Crane |
| 10:30am | Anuj | Live Reaction | Nicole Crane: Tech stack vs Talent stack misaligned |
| 12pm | Nina | Session Highlight | Hans Clevers: Rewriting rules, proxy problem |
| 2pm | Ben | Booth | Booth is live, great conversations |
| 5pm | Nina | Technical Session | Amrik Mahal & Hebe Middlemiss (AZ) - Lab of 2030 |
| 7pm | All (Ben) | Evening Wrap | Day 1 done, incredible keynotes |

#### Wednesday (Day 2 - Sessions)
| Time | Owner | Type | Content |
|------|-------|------|---------|
| 8am | Anuj | Preview | Today's focus: AI track deep dives |
| 10am | Nina | Session Highlight | Technical session reaction |
| 12pm | Ben | Networking | Lunch conversations |
| 2pm | Anuj | Live Reaction | Key insight from afternoon session |
| 4pm | Nina | Session Highlight | Julia Fox (Takeda) - Semantic Tools |
| 7pm | All (Ben) | Evening Wrap | Day 2 summary |

#### Thursday (Day 3 - Wrap-up)
| Time | Owner | Type | Content |
|------|-------|------|---------|
| 9am | Anuj | Preview | Final day agenda |
| 11am | Nina | Session Highlight | Morning session reaction |
| 2pm | Ben | Booth Wrap | Final booth conversations, demo count |
| 5pm | All (Anuj) | Conference Close | Thank you Boston, key takeaways |

### 9.6 Content Library Items

#### Statistics
| Label | Content | Source |
|-------|---------|--------|
| AI Failure Rate | 87% of AI projects fail | Industry research |
| Data Initiative Failure | 70% of data initiatives fail | Pg 21 |
| FDA Warnings | 190 FDA warning letters for data integrity in FY2024 | FDA data |

#### Framework - North (Statistical Health)
| Label | Content |
|-------|---------|
| North Definition | Can the data learn? Does it have the mathematical properties for ML? |
| North Metrics | Data Sufficiency (Factor 50), Class Balance, Feature Quality (VIF), Bias Risk (Shannon entropy) |
| North Trap | 100% complete but 95% one class |

#### Framework - East (Semantic Clarity)
| Label | Content |
|-------|---------|
| East Definition | Can AI reason with it? Are meanings explicit? |
| East Metrics | FAIR Compliance, Ontology Coverage (HGNC, GO, UniProt, ChEBI), Knowledge Graph Connectivity |
| East Trap | KRAS with no Gene Ontology link |

#### Framework - South (Contextual Validity)
| Label | Content |
|-------|---------|
| South Definition | Is it measuring the right thing? Data-problem fit? |
| South Metrics | Data-Problem Fit, Proxy Variable Detection, Domain Appropriateness, Temporal Validity |
| South Trap | Race/ethnicity encoding healthcare access, not biology |

#### Framework - West (Governance & Safety)
| Label | Content |
|-------|---------|
| West Definition | Can you use it safely and legally? |
| West Metrics | Privacy Risk (k-anonymity), ALCOA+ (21 CFR Part 11), Bias & Fairness, Licensing |
| West Trap | Non-compliant with regulations |

#### Hashtags
| Label | Content |
|-------|---------|
| Conference | #LabOfTheFuture #LotF2026 |
| Product | #DataCompass |
| Topic | #AIReadiness #AIReadyData #FAIRData #Ontology #MLReadiness |

#### Speakers
| Label | Content |
|-------|---------|
| Hans Clevers | Roche - Rewriting rules |
| Christopher Arendt | Takeda |
| Nicole Crane | Accenture - Tech stack vs Talent stack |
| Julia Fox | Takeda - Semantic Tools |
| Sam Michael | GSK - Automation |
| Amrik Mahal | AstraZeneca - Lab of 2030 |
| Hebe Middlemiss | AstraZeneca - Lab of 2030 |
| Petrina Kamya | Insilico Medicine - Autonomous labs |
| Yves Fomekong Nanfack | Session speaker |

---

## Appendix A: LinkedIn Carousel Content

**Title**: The 4 Directions of AI Readiness
**Format**: 10 slides, 1080x1350px
**Owner**: Anuj (Week 3, Tuesday)

| Slide | Headline | Content |
|-------|----------|---------|
| 1 | HOOK | Your Data Is Clean. But Is It Ready? 87% of AI projects fail. |
| 2 | THE PROBLEM | Clean ≠ Ready. Clean = no duplicates. Ready = models can learn. |
| 3 | THE COMPASS | 4 Cardinal Directions: N, E, S, W |
| 4 | NORTH | Can It Learn? Factor 50, Class Balance, VIF, Shannon entropy |
| 5 | EAST | Can It Reason? FAIR, Ontology Coverage, Knowledge Graph |
| 6 | SOUTH | Is It Right? Data-Problem Fit, Proxy Detection, Temporal Validity |
| 7 | WEST | Is It Safe? k-anonymity, ALCOA+, Bias & Fairness, Licensing |
| 8 | MATRIX | Asset Maturity x Execution Risk 2x2 |
| 9 | PAYOFF | From 80% cleaning to upfront assessment |
| 10 | CTA | Book 15-min Readiness Audit |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Cross-Pollination | Team members commenting on each other's posts within 2 hours |
| Conference Mode | Real-time posting schedule during the conference |
| Content Library | Reusable messaging snippets |
| Phase | Campaign stage (Agitate, Educate, Hype, Conference, Follow-Up) |
| Persona | Team member's social media identity and tone |

---

*End of Design Document*
