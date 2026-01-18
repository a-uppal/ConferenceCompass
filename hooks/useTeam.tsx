import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Team, Conference, TeamMember } from '@/types/database';

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  activeConference: Conference | null;
  teamMembers: TeamMember[];
  conferences: Conference[];
  isLoading: boolean;
  setActiveTeam: (team: Team | null) => void;
  setActiveConference: (conference: Conference | null) => void;
  createTeam: (name: string, description?: string) => Promise<Team>;
  joinTeam: (teamId: string) => Promise<void>;
  createConference: (data: Omit<Conference, 'id' | 'created_at' | 'updated_at'>) => Promise<Conference>;
  refreshTeams: () => Promise<void>;
  refreshConferences: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeConference, setActiveConference] = useState<Conference | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teams when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTeams();
    } else {
      setTeams([]);
      setActiveTeam(null);
      setActiveConference(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load conferences when active team changes
  useEffect(() => {
    if (activeTeam) {
      loadTeamConferences(activeTeam.id);
      loadTeamMembers(activeTeam.id);
    } else {
      setConferences([]);
      setTeamMembers([]);
    }
  }, [activeTeam]);

  const loadUserTeams = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: memberRecords, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (memberRecords && memberRecords.length > 0) {
        const teamIds = memberRecords.map((m) => m.team_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds);

        if (teamsError) throw teamsError;

        setTeams(teamsData || []);

        // Auto-select first team if none selected
        if (!activeTeam && teamsData && teamsData.length > 0) {
          setActiveTeam(teamsData[0]);
        }
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamConferences = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('conferences')
        .select('*')
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setConferences(data || []);

      // Auto-select most recent/active conference
      if (data && data.length > 0) {
        const now = new Date();
        const activeConf = data.find((c) => {
          const start = new Date(c.start_date);
          const end = new Date(c.end_date);
          return now >= start && now <= end;
        });
        setActiveConference(activeConf || data[0]);
      }
    } catch (error) {
      console.error('Error loading conferences:', error);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          users:user_id (id, email, full_name, avatar_url)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const createTeam = async (name: string, description?: string): Promise<Team> => {
    if (!user) throw new Error('Must be authenticated to create a team');

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    // Refresh teams and set as active
    await loadUserTeams();
    setActiveTeam(team);

    return team;
  };

  const joinTeam = async (teamId: string): Promise<void> => {
    if (!user) throw new Error('Must be authenticated to join a team');

    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: user.id,
        role: 'member',
      });

    if (error) throw error;

    await loadUserTeams();
  };

  const createConference = async (
    data: Omit<Conference, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Conference> => {
    const { data: conference, error } = await supabase
      .from('conferences')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    await loadTeamConferences(data.team_id);
    setActiveConference(conference);

    return conference;
  };

  const refreshTeams = async () => {
    await loadUserTeams();
  };

  const refreshConferences = async () => {
    if (activeTeam) {
      await loadTeamConferences(activeTeam.id);
    }
  };

  const value: TeamContextType = {
    teams,
    activeTeam,
    activeConference,
    teamMembers,
    conferences,
    isLoading,
    setActiveTeam,
    setActiveConference,
    createTeam,
    joinTeam,
    createConference,
    refreshTeams,
    refreshConferences,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
