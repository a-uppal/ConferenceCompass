import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, Surface, Button, Card, ActivityIndicator, TextInput, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { Conference, Team } from '@/types/database';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';

export function ConferenceSelector() {
  const { user } = useAuth();
  const {
    teams,
    conferences,
    activeTeam,
    activeConference,
    isLoading,
    setActiveConference,
    createTeam,
    refreshTeams,
  } = useTeam();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Load available teams that user can join
  useEffect(() => {
    if (user && teams.length === 0) {
      loadAvailableTeams();
    }
  }, [user, teams.length]);

  const loadAvailableTeams = async () => {
    try {
      // Get all teams (for demo/development - in production, this would be invite-based)
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .limit(10);

      if (error) {
        // Ignore AbortError - it's expected during navigation
        if (!error.message?.includes('AbortError') && !error.message?.includes('aborted')) {
          console.error('[ConferenceSelector] Error loading available teams:', error);
        }
        return;
      }

      setAvailableTeams(data || []);
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
        console.error('[ConferenceSelector] Error:', error);
      }
    }
  };

  const handleLinkToTeam = async (teamId: string) => {
    if (!user) return;

    setIsLinking(true);
    setLinkError(null);
    try {
      console.log('[ConferenceSelector] Linking user', user.id, 'to team', teamId);

      // First, ensure user profile exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Create user profile
        const { error: userCreateError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
        });

        if (userCreateError) {
          console.error('[ConferenceSelector] Error creating user profile:', userCreateError);
          setLinkError('Failed to create user profile: ' + userCreateError.message);
          return;
        }
      }

      // Now link to team
      const { error: linkError } = await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: user.id,
        role: 'member',
      });

      if (linkError) {
        console.error('[ConferenceSelector] Error linking to team:', linkError);
        setLinkError('Failed to join team: ' + linkError.message);
        return;
      }

      console.log('[ConferenceSelector] Successfully linked to team');
      // Refresh teams to pick up the new membership
      await refreshTeams();
    } catch (error: any) {
      console.error('[ConferenceSelector] Error:', error);
      setLinkError(error.message || 'Unknown error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSelectConference = (conference: Conference) => {
    setActiveConference(conference);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      await createTeam(teamName.trim(), 'My conference team');
      setShowCreateTeam(false);
      setTeamName('');
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading your conferences...</Text>
      </View>
    );
  }

  // Auto-fix: link user to team with conference
  const autoLinkToConferenceTeam = async () => {
    if (!user || isLinking) return;

    setIsLinking(true);
    setLinkError(null);
    try {
      // Ensure user profile exists
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      }, { onConflict: 'id' });

      // Find team that owns a conference (LOTF)
      const { data: conferences } = await supabase
        .from('conferences')
        .select('team_id, name')
        .limit(1);

      if (!conferences || conferences.length === 0 || !conferences[0].team_id) {
        setLinkError('No conferences found in database. Run the seed script first.');
        return;
      }

      const teamId = conferences[0].team_id;
      console.log('[ConferenceSelector] Auto-linking to team:', teamId, 'for conference:', conferences[0].name);

      // Link to team
      const { error: linkErr } = await supabase.from('team_members').upsert({
        team_id: teamId,
        user_id: user.id,
        role: 'member',
      }, { onConflict: 'team_id,user_id' });

      if (linkErr) {
        setLinkError('Link error: ' + linkErr.message);
        return;
      }

      // Refresh to pick up the team
      await refreshTeams();
    } catch (e: any) {
      setLinkError(e.message || 'Failed to link');
    } finally {
      setIsLinking(false);
    }
  };

  // No teams - show available teams to join OR create new
  if (teams.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-group" size={64} color="#0D9488" />
          <Text variant="headlineSmall" style={styles.title}>
            Welcome to Conference Compass
          </Text>
          <Text style={styles.subtitle}>
            You need to be linked to a team to see conferences.
          </Text>

          {/* Quick fix button */}
          <Button
            mode="contained"
            onPress={autoLinkToConferenceTeam}
            loading={isLinking}
            disabled={isLinking}
            style={styles.quickFixButton}
            icon="link-variant"
          >
            Link Me to LOTF Conference
          </Button>

          {/* Debug info */}
          <Text style={styles.debugText}>
            Your User ID: {user?.id?.substring(0, 8)}...
          </Text>

          <Button
            mode="outlined"
            onPress={() => router.push('/debug')}
            style={{ marginBottom: 16 }}
            icon="bug"
          >
            Open Debug Screen
          </Button>

          {linkError && (
            <Text style={styles.errorText}>{linkError}</Text>
          )}

          {/* Available teams to join */}
          {availableTeams.length > 0 && (
            <View style={styles.availableTeamsSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Join an Existing Team
              </Text>
              {availableTeams.map((team) => (
                <Card key={team.id} style={styles.teamCard}>
                  <Card.Content>
                    <Text variant="titleSmall">{team.name}</Text>
                    {team.description && (
                      <Text style={styles.teamDescription}>{team.description}</Text>
                    )}
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      mode="contained"
                      onPress={() => handleLinkToTeam(team.id)}
                      loading={isLinking}
                      disabled={isLinking}
                    >
                      Join Team
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create new team */}
          <Text style={styles.subtitle}>
            Create a new team to get started
          </Text>

          <TextInput
            label="Team Name"
            value={teamName}
            onChangeText={setTeamName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Data Compass Sales Team"
          />

          <Button
            mode="contained"
            onPress={handleCreateTeam}
            loading={isCreating}
            disabled={!teamName.trim() || isCreating}
            style={styles.button}
          >
            Create Team
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  // Has team but no conferences
  if (conferences.length === 0) {
    return (
      <View style={styles.container}>
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-blank" size={64} color="#F59E0B" />
          <Text variant="headlineSmall" style={styles.title}>
            No Conferences Yet
          </Text>
          <Text style={styles.subtitle}>
            Your team "{activeTeam?.name}" doesn't have any conferences set up yet.
          </Text>
          <Text style={styles.hint}>
            Ask your team admin to add a conference, or contact support to import conference data.
          </Text>
        </Surface>
      </View>
    );
  }

  // Has conferences - show selector
  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.headerTitle}>
        Select a Conference
      </Text>
      <Text style={styles.headerSubtitle}>
        Choose which conference you're attending
      </Text>

      <FlatList
        data={conferences}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = activeConference?.id === item.id;
          const startDate = new Date(item.start_date);
          const endDate = new Date(item.end_date);

          return (
            <Card
              style={[styles.conferenceCard, isSelected && styles.selectedCard]}
              onPress={() => handleSelectConference(item)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'check-circle' : 'calendar-star'}
                    size={24}
                    color={isSelected ? '#10B981' : '#0D9488'}
                  />
                  <Text variant="titleMedium" style={styles.conferenceName}>
                    {item.name}
                  </Text>
                </View>

                {item.location && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#94A3B8" />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="calendar-range" size={16} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                {item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  hint: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  quickFixButton: {
    backgroundColor: '#10B981',
    marginBottom: 24,
    paddingVertical: 4,
  },
  debugText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  availableTeamsSection: {
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  teamCard: {
    marginBottom: 12,
  },
  teamDescription: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  headerTitle: {
    color: '#F8FAFC',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#94A3B8',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  conferenceCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  conferenceName: {
    flex: 1,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  description: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
});
