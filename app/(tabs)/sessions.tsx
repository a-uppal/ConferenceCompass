import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, Surface, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { useSessionStore } from '@/stores/sessionStore';
import { Session } from '@/types/database';
import { toLocalDateString, isSessionLive, parseLocalDate } from '@/utils/dateUtils';

export default function SessionsScreen() {
  const { activeConference } = useTeam();
  const {
    sessions,
    isLoading,
    filters,
    selectedDate,
    setFilters,
    setSelectedDate,
    loadSessions,
    getSessionsByDate,
    getTracks,
  } = useSessionStore();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeConference) {
      loadSessions(activeConference.id);
      // Set initial date to conference start date (local timezone)
      if (activeConference.start_date) {
        setSelectedDate(parseLocalDate(activeConference.start_date));
      }
    }
  }, [activeConference]);

  const onRefresh = async () => {
    if (!activeConference) return;
    setRefreshing(true);
    await loadSessions(activeConference.id);
    setRefreshing(false);
  };

  const filteredSessions = getSessionsByDate(selectedDate);
  const tracks = getTracks();

  // Get unique dates from sessions for calendar (memoized, local timezone)
  const sessionDates = useMemo(() => {
    return [...new Set(
      sessions.map((s) => toLocalDateString(new Date(s.start_time)))
    )].sort();
  }, [sessions]);

  const handleSessionPress = (session: Session) => {
    router.push(`/session/${session.id}`);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAttendanceIcon = (status?: string) => {
    switch (status) {
      case 'planned':
        return { icon: 'calendar-check', color: '#3B82F6' };
      case 'attending':
        return { icon: 'account-check', color: '#F59E0B' };
      case 'attended':
        return { icon: 'check-circle', color: '#10B981' };
      case 'skipped':
        return { icon: 'skip-next-circle', color: '#94A3B8' };
      default:
        return null;
    }
  };

  const renderSession = ({ item }: { item: Session & { attendance?: any; talking_points?: any[] } }) => {
    const attendanceInfo = getAttendanceIcon(item.attendance?.status);
    const isNow = isSessionLive(item.start_time, item.end_time);
    const hasTalkingPoints = item.talking_points && item.talking_points.length > 0;

    return (
      <Card style={styles.sessionCard} onPress={() => handleSessionPress(item)}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
              <Text style={styles.timeDivider}>|</Text>
              <Text style={styles.timeText}>{formatTime(item.end_time)}</Text>
            </View>

            <View style={styles.sessionContent}>
              <View style={styles.titleRow}>
                {isNow && (
                  <Chip compact style={styles.liveChip} textStyle={styles.liveChipText}>
                    LIVE
                  </Chip>
                )}
                <Text variant="titleMedium" style={styles.sessionTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>

              {item.speaker_name && (
                <Text style={styles.speakerText}>
                  {item.speaker_name}
                  {item.speaker_company && ` • ${item.speaker_company}`}
                </Text>
              )}

              <View style={styles.sessionMeta}>
                {item.location && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#94A3B8" />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}
                {item.track && (
                  <Chip compact style={styles.trackChip}>
                    {item.track}
                  </Chip>
                )}
                {hasTalkingPoints && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="lightbulb" size={14} color="#F59E0B" />
                    <Text style={styles.metaText}>{item.talking_points!.length} points</Text>
                  </View>
                )}
              </View>
            </View>

            {attendanceInfo && (
              <MaterialCommunityIcons
                name={attendanceInfo.icon as any}
                size={24}
                color={attendanceInfo.color}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDateSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateSelector}
    >
      {sessionDates.map((dateStr) => {
        const date = parseLocalDate(dateStr);
        const isSelected = toLocalDateString(selectedDate) === dateStr;
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
        const dayNum = date.getDate();
        const monthName = date.toLocaleDateString(undefined, { month: 'short' });

        return (
          <Pressable
            key={dateStr}
            onPress={() => setSelectedDate(date)}
          >
            <Surface style={[styles.dateCard, isSelected && styles.dateCardSelected]}>
              <Text style={[styles.dayName, isSelected && styles.dateTextSelected]}>
                {dayName}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dateTextSelected]}>
                {dayNum}
              </Text>
              <Text style={[styles.monthName, isSelected && styles.dateTextSelected]}>
                {monthName}
              </Text>
            </Surface>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}
          buttons={[
            { value: 'list', label: 'List', icon: 'format-list-bulleted' },
            { value: 'calendar', label: 'Calendar', icon: 'calendar' },
          ]}
          style={styles.segmented}
        />
      </View>

      {sessionDates.length > 0 && renderDateSelector()}

      <View style={styles.filterRow}>
        <Chip
          style={[
            styles.chip,
            filters.attendanceStatus === 'all' && styles.chipSelected,
          ]}
          selected={filters.attendanceStatus === 'all'}
          onPress={() => setFilters({ attendanceStatus: 'all' })}
        >
          All
        </Chip>
        <Chip
          style={[
            styles.chip,
            filters.attendanceStatus === 'planned' && styles.chipSelected,
          ]}
          selected={filters.attendanceStatus === 'planned'}
          onPress={() => setFilters({ attendanceStatus: 'planned' })}
        >
          Planned
        </Chip>
        {tracks.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tracks.map((track) => (
              <Chip
                key={track}
                style={[
                  styles.chip,
                  filters.track === track && styles.chipSelected,
                ]}
                selected={filters.track === track}
                onPress={() => setFilters({ track: filters.track === track ? null : track })}
              >
                {track}
              </Chip>
            ))}
          </ScrollView>
        )}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank" size={64} color="#94A3B8" />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Sessions Loaded
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Import the conference schedule to see sessions with integrated talking points.
          </Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Sessions on This Day
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Select another date or adjust your filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D9488"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  controls: {
    padding: 16,
    paddingBottom: 8,
  },
  segmented: {
    backgroundColor: '#1E293B',
  },
  dateSelector: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dateCard: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  dateCardSelected: {
    backgroundColor: '#0D9488',
  },
  dayName: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dayNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  monthName: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dateTextSelected: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  chipSelected: {
    backgroundColor: '#0D9488',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timeDivider: {
    color: '#475569',
    marginVertical: 2,
  },
  sessionContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  liveChip: {
    backgroundColor: '#EF4444',
    height: 20,
  },
  liveChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sessionTitle: {
    flex: 1,
    fontWeight: '600',
  },
  speakerText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  trackChip: {
    backgroundColor: '#1E293B',
    height: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
});
