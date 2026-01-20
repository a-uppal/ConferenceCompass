import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Divider } from 'react-native-paper';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function DebugScreen() {
  const { user, session, isAuthenticated } = useAuth();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: Record<string, any> = {};

    // 1. Auth state
    diagnostics.auth = {
      isAuthenticated,
      userId: user?.id || 'NO USER',
      email: user?.email || 'NO EMAIL',
      sessionExists: !!session,
    };

    // 2. Try to get session directly
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    diagnostics.sessionCheck = {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id || 'NONE',
      error: sessionError?.message || null,
    };

    // 3. Query teams (no filter)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
    diagnostics.teamsQuery = {
      count: teams?.length || 0,
      data: teams,
      error: teamsError?.message || null,
    };

    // 4. Query team_members (no filter)
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*');
    diagnostics.teamMembersQuery = {
      count: members?.length || 0,
      data: members,
      error: membersError?.message || null,
    };

    // 5. Query team_members for current user
    if (user?.id) {
      const { data: myMemberships, error: myMembersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id);
      diagnostics.myMemberships = {
        count: myMemberships?.length || 0,
        data: myMemberships,
        error: myMembersError?.message || null,
      };
    }

    // 6. Query conferences
    const { data: conferences, error: confError } = await supabase
      .from('conferences')
      .select('*');
    diagnostics.conferencesQuery = {
      count: conferences?.length || 0,
      data: conferences,
      error: confError?.message || null,
    };

    // 7. Query users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    diagnostics.usersQuery = {
      count: users?.length || 0,
      data: users,
      error: usersError?.message || null,
    };

    // 8. Check if current auth user exists in users table
    if (user?.id) {
      const { data: myProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      diagnostics.myProfile = {
        exists: !!myProfile,
        data: myProfile,
        error: profileError?.message || null,
      };
    }

    setResults(diagnostics);
    setLoading(false);
  };

  const fixUserProfile = async () => {
    if (!user) {
      alert('No user logged in');
      return;
    }

    setLoading(true);
    try {
      // Create user profile if missing
      const { error: profileError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      }, { onConflict: 'id' });

      if (profileError) {
        alert('Profile error: ' + profileError.message);
        return;
      }

      // Find the team that owns the LOTF conference (or any conference)
      const { data: conferences } = await supabase
        .from('conferences')
        .select('team_id, name')
        .limit(1);

      let teamId: string | null = null;

      if (conferences && conferences.length > 0 && conferences[0].team_id) {
        teamId = conferences[0].team_id;
        console.log('[Debug] Found conference team:', teamId, conferences[0].name);
      } else {
        // Fallback: get any team
        const { data: teams } = await supabase.from('teams').select('id').limit(1);
        if (teams && teams.length > 0) {
          teamId = teams[0].id;
          console.log('[Debug] Fallback to first team:', teamId);
        }
      }

      if (!teamId) {
        // Create a team if none exists
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({ name: 'My Team', description: 'Auto-created team', created_by: user.id })
          .select()
          .single();

        if (teamError) {
          alert('Failed to create team: ' + teamError.message);
          return;
        }
        teamId = newTeam.id;
        console.log('[Debug] Created new team:', teamId);
      }

      // Link user to team
      const { error: linkError } = await supabase.from('team_members').upsert({
        team_id: teamId,
        user_id: user.id,
        role: 'owner',
      }, { onConflict: 'team_id,user_id' });

      if (linkError) {
        alert('Link error: ' + linkError.message);
        return;
      }

      alert('Success! Profile created and linked to team. Go back to home and refresh.');
      runDiagnostics();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Debug Diagnostics</Text>

      <Button mode="contained" onPress={runDiagnostics} loading={loading} style={styles.button}>
        Run Diagnostics
      </Button>

      <Button mode="contained-tonal" onPress={fixUserProfile} loading={loading} style={styles.button}>
        Fix: Create Profile & Link to Team
      </Button>

      <Divider style={styles.divider} />

      {Object.entries(results).map(([key, value]) => (
        <Surface key={key} style={styles.card}>
          <Text variant="titleMedium" style={styles.cardTitle}>{key}</Text>
          <Text style={styles.code}>{JSON.stringify(value, null, 2)}</Text>
        </Surface>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  title: {
    color: '#F8FAFC',
    marginBottom: 16,
    marginTop: 40,
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  cardTitle: {
    color: '#0D9488',
    marginBottom: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#94A3B8',
  },
});
