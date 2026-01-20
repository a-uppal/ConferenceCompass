// Re-export all types
export * from './database';
export * from './campaign';

// App-specific types
export interface AppState {
  user: import('./database').User | null;
  activeTeam: import('./database').Team | null;
  activeConference: import('./database').Conference | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface NavigationParams {
  sessionId?: string;
  contactId?: string;
  postId?: string;
}
