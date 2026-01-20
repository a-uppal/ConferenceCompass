import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Surface, List, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { activeConference, activeTeam } = useTeam();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>
        <Divider style={styles.divider} />

        <List.Item
          title={user?.email || 'Not logged in'}
          description="Email"
          left={(props) => <List.Icon {...props} icon="email" />}
        />

        <List.Item
          title={user?.user_metadata?.full_name || 'Unknown'}
          description="Name"
          left={(props) => <List.Icon {...props} icon="account" />}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Conference</Text>
        <Divider style={styles.divider} />

        <List.Item
          title={activeConference?.name || 'No conference selected'}
          description="Active Conference"
          left={(props) => <List.Icon {...props} icon="calendar-star" />}
        />

        <List.Item
          title={activeTeam?.name || 'No team selected'}
          description="Team"
          left={(props) => <List.Icon {...props} icon="account-group" />}
        />

        <Divider style={styles.divider} />

        <List.Item
          title="Manage Conferences"
          description="Create, edit, and select conferences"
          left={(props) => <List.Icon {...props} icon="calendar-edit" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/conferences')}
          style={styles.navItem}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Actions</Text>
        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={handleLogoutConfirm}
          loading={isLoading}
          icon="logout"
          style={styles.logoutButton}
          textColor="#EF4444"
        >
          Sign Out
        </Button>
      </Surface>

      <View style={styles.footer}>
        <Text style={styles.version}>Conference Compass v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0D9488',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#EF4444',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    padding: 16,
  },
  version: {
    color: '#64748B',
    fontSize: 12,
  },
  navItem: {
    paddingVertical: 4,
  },
});
