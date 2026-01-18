// Database types for Conference Compass
// These types mirror the Supabase schema

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Conference {
  id: string;
  team_id: string;
  name: string;
  location?: string;
  start_date: string;
  end_date: string;
  description?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  conference_id: string;
  title: string;
  description?: string;
  speaker_name?: string;
  speaker_company?: string;
  location?: string;
  start_time: string;
  end_time: string;
  session_type?: string;
  track?: string;
  created_at: string;
  updated_at: string;
}

export interface TalkingPoint {
  id: string;
  session_id: string;
  content: string;
  category?: string;
  priority: number;
  created_at: string;
}

export interface SessionAttendance {
  id: string;
  session_id: string;
  user_id: string;
  status: 'planned' | 'attending' | 'attended' | 'skipped';
  key_takeaways?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionCapture {
  id: string;
  session_id: string;
  user_id: string;
  capture_type: 'photo' | 'voice_note' | 'text_note';
  content_url?: string;
  transcription?: string;
  text_content?: string;
  created_at: string;
}

export interface Post {
  id: string;
  conference_id: string;
  author_id: string;
  scheduled_date: string;
  scheduled_time?: string;
  platform: 'linkedin' | 'twitter' | 'other';
  content_preview?: string;
  linkedin_url?: string;
  status: 'scheduled' | 'published' | 'skipped';
  week_number?: number;
  post_type?: string;
  created_at: string;
  updated_at: string;
}

export interface PostEngagement {
  id: string;
  post_id: string;
  user_id: string;
  engagement_type: 'like' | 'comment' | 'share';
  engaged_at: string;
}

export interface TeamActivity {
  id: string;
  team_id: string;
  conference_id: string;
  user_id: string;
  activity_type: 'contact_captured' | 'session_attended' | 'post_published' | 'post_engaged' | 'check_in';
  entity_id?: string;
  description: string;
  created_at: string;
}

export interface DailyCheckIn {
  id: string;
  conference_id: string;
  user_id: string;
  check_in_date: string;
  priorities?: string;
  location?: string;
  status: 'available' | 'busy' | 'in_session';
  created_at: string;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<TeamMember, 'id'>>;
      };
      conferences: {
        Row: Conference;
        Insert: Omit<Conference, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Conference, 'id'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Contact, 'id'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Session, 'id'>>;
      };
      talking_points: {
        Row: TalkingPoint;
        Insert: Omit<TalkingPoint, 'id' | 'created_at'>;
        Update: Partial<Omit<TalkingPoint, 'id'>>;
      };
      session_attendance: {
        Row: SessionAttendance;
        Insert: Omit<SessionAttendance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SessionAttendance, 'id'>>;
      };
      session_captures: {
        Row: SessionCapture;
        Insert: Omit<SessionCapture, 'id' | 'created_at'>;
        Update: Partial<Omit<SessionCapture, 'id'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Post, 'id'>>;
      };
      post_engagements: {
        Row: PostEngagement;
        Insert: Omit<PostEngagement, 'id' | 'engaged_at'>;
        Update: Partial<Omit<PostEngagement, 'id'>>;
      };
      team_activities: {
        Row: TeamActivity;
        Insert: Omit<TeamActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<TeamActivity, 'id'>>;
      };
      daily_check_ins: {
        Row: DailyCheckIn;
        Insert: Omit<DailyCheckIn, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyCheckIn, 'id'>>;
      };
    };
  };
}
