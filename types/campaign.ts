// Campaign Management Types for Conference Compass
// These types support the social media campaign feature

import { User, Post } from './database';

// ============================================
// ENUMS AND LITERAL TYPES
// ============================================

export type CampaignPhaseName = 'Agitate' | 'Educate' | 'Hype' | 'Conference' | 'Follow-Up';
export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'published' | 'skipped';
export type PostPlatform = 'linkedin' | 'twitter' | 'other' | 'both';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type CrossPollinationStatus = 'pending' | 'completed' | 'missed';
export type ContentCategory = 'statistic' | 'framework' | 'hashtag' | 'cta' | 'speaker' | 'other';
export type InteractionType = 'booth' | 'session' | 'networking' | 'demo_request' | 'other';

// ============================================
// CAMPAIGN PHASES
// ============================================

export interface CampaignPhase {
  id: string;
  conference_id: string;
  name: CampaignPhaseName;
  description?: string;
  week_start: number;
  week_end: number;
  goal?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignPhaseInsert {
  conference_id: string;
  name: CampaignPhaseName;
  description?: string;
  week_start: number;
  week_end: number;
  goal?: string;
  order_index?: number;
}

// ============================================
// TEAM PERSONAS
// ============================================

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
  user?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

export interface TeamPersonaInsert {
  conference_id: string;
  user_id: string;
  persona_name: string;
  lane?: string;
  tone?: string;
  key_slides?: string[];
}

// ============================================
// ENHANCED POST (extends base Post)
// ============================================

export interface CampaignPost extends Post {
  phase_id?: string;
  theme?: string;
  content?: string;
  visual_asset?: string;
  day_of_week?: DayOfWeek;
  cross_pollination_required: boolean;
  cross_pollination_window_hours: number;
  posted_at?: string;
  // Joined data
  author?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
  phase?: CampaignPhase;
  cross_pollination_tasks?: CrossPollinationTask[];
}

export interface CampaignPostInsert {
  conference_id: string;
  author_id: string;
  scheduled_date: string;
  scheduled_time?: string;
  platform?: PostPlatform;
  week_number?: number;
  post_type?: string;
  phase_id?: string;
  theme?: string;
  content?: string;
  content_preview?: string;
  visual_asset?: string;
  day_of_week?: DayOfWeek;
  status?: PostStatus;
  cross_pollination_required?: boolean;
  cross_pollination_window_hours?: number;
}

export interface CampaignPostUpdate {
  scheduled_date?: string;
  scheduled_time?: string;
  platform?: PostPlatform;
  week_number?: number;
  post_type?: string;
  phase_id?: string;
  theme?: string;
  content?: string;
  content_preview?: string;
  visual_asset?: string;
  day_of_week?: DayOfWeek;
  status?: PostStatus;
  linkedin_url?: string;
  posted_at?: string;
  cross_pollination_required?: boolean;
  cross_pollination_window_hours?: number;
}

// ============================================
// CROSS-POLLINATION
// ============================================

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
  commenter?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
  post?: CampaignPost;
}

export interface CrossPollinationInsert {
  post_id: string;
  commenter_id: string;
  required_by: string;
  status?: CrossPollinationStatus;
}

export interface CrossPollinationComplete {
  comment_url?: string;
  comment_text?: string;
}

// ============================================
// CONTENT LIBRARY
// ============================================

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

export interface ContentLibraryInsert {
  conference_id: string;
  category: ContentCategory;
  label: string;
  content: string;
  source?: string;
}

// ============================================
// CONFERENCE SCHEDULE
// ============================================

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
  owner?: Pick<User, 'id' | 'full_name'>;
  actual_post?: CampaignPost;
}

export interface ConferenceScheduleInsert {
  conference_id: string;
  schedule_day: string;
  schedule_time: string;
  owner_id?: string;
  post_type: string;
  content_summary?: string;
  visual_suggestion?: string;
}

// ============================================
// CAMPAIGN CONTACTS
// ============================================

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
  interaction_type?: InteractionType;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  source_post_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  captured_by_user?: Pick<User, 'id' | 'full_name'>;
  source_post?: CampaignPost;
}

export interface CampaignContactInsert {
  conference_id: string;
  captured_by: string;
  name: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  notes?: string;
  interaction_type?: InteractionType;
  follow_up_required?: boolean;
  source_post_id?: string;
}

// ============================================
// AGGREGATE / VIEW TYPES
// ============================================

export interface WeeklyCalendarData {
  week: number;
  phase?: CampaignPhase;
  posts_by_day: Record<DayOfWeek, CampaignPost[]>;
  posts_by_owner: Record<string, CampaignPost[]>;
}

export interface CampaignDashboardData {
  conference: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  days_until_conference: number;
  current_phase?: CampaignPhase;
  current_week: number;
  stats: CampaignStats;
  this_week_posts: CampaignPost[];
  pending_cross_pollination: CrossPollinationTask[];
  team_personas: TeamPersona[];
}

export interface CampaignStats {
  total_posts: number;
  draft_posts: number;
  scheduled_posts: number;
  posted_posts: number;
  cross_pollination_pending: number;
  cross_pollination_completed: number;
  cross_pollination_missed: number;
  cross_pollination_compliance_rate: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CampaignPhaseWithPosts extends CampaignPhase {
  posts: CampaignPost[];
}

export interface PostWithCrossPollination extends CampaignPost {
  cross_pollination_tasks: CrossPollinationTask[];
}

export interface ConferenceScheduleDay {
  day: string;
  slots: ConferenceScheduleSlot[];
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface PostEditorFormData {
  theme: string;
  content: string;
  visual_asset?: string;
  scheduled_date: string;
  scheduled_time?: string;
  day_of_week?: DayOfWeek;
  week_number?: number;
  phase_id?: string;
  platform: PostPlatform;
  cross_pollination_required: boolean;
  cross_pollination_window_hours: number;
}

export interface QuickPostFormData {
  content: string;
  visual_asset?: string;
  schedule_slot_id?: string;
}

export interface CrossPollinationFormData {
  comment_url?: string;
  comment_text?: string;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseCampaignReturn {
  phases: CampaignPhase[];
  currentPhase: CampaignPhase | null;
  stats: CampaignStats | null;
  isLoading: boolean;
  error: Error | null;
  refreshPhases: () => Promise<void>;
}

export interface UseSocialPostsReturn {
  posts: CampaignPost[];
  isLoading: boolean;
  error: Error | null;
  createPost: (data: CampaignPostInsert) => Promise<CampaignPost>;
  updatePost: (id: string, data: CampaignPostUpdate) => Promise<CampaignPost>;
  deletePost: (id: string) => Promise<void>;
  markAsPosted: (id: string, url?: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export interface UseCrossPollinationReturn {
  tasks: CrossPollinationTask[];
  pendingTasks: CrossPollinationTask[];
  isLoading: boolean;
  error: Error | null;
  completeTask: (taskId: string, data: CrossPollinationComplete) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export interface UseContentLibraryReturn {
  items: ContentLibraryItem[];
  isLoading: boolean;
  error: Error | null;
  getByCategory: (category: ContentCategory) => ContentLibraryItem[];
  useItem: (itemId: string) => Promise<void>;
  createItem: (data: ContentLibraryInsert) => Promise<ContentLibraryItem>;
  refreshItems: () => Promise<void>;
}

export interface UseConferenceScheduleReturn {
  slots: ConferenceScheduleSlot[];
  todaySlots: ConferenceScheduleSlot[];
  isLoading: boolean;
  error: Error | null;
  linkPostToSlot: (slotId: string, postId: string) => Promise<void>;
  refreshSchedule: () => Promise<void>;
}
