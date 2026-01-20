import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Chip, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CampaignPost, CampaignPhase, DayOfWeek, PostStatus } from '@/types/campaign';

interface PostCalendarViewProps {
  posts: CampaignPost[];
  phases: CampaignPhase[];
  currentWeek: number;
  onPostPress?: (post: CampaignPost) => void;
  onAddPost?: (date: string, dayOfWeek: DayOfWeek) => void;
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: '#64748B',
  scheduled: '#3B82F6',
  posted: '#10B981',
  published: '#10B981',
  skipped: '#EF4444',
};

const PHASE_COLORS: Record<string, string> = {
  'Agitate': '#EF4444',
  'Educate': '#3B82F6',
  'Hype': '#F59E0B',
  'Conference': '#10B981',
  'Follow-Up': '#8B5CF6',
};

export function PostCalendarView({
  posts,
  phases,
  currentWeek,
  onPostPress,
  onAddPost,
}: PostCalendarViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // Get all weeks that have posts
  const weeksWithPosts = useMemo(() => {
    const weeks = new Set<number>();
    posts.forEach((post) => {
      if (post.week_number) weeks.add(post.week_number);
    });
    // Add surrounding weeks for navigation
    const minWeek = Math.min(...Array.from(weeks), selectedWeek) - 1;
    const maxWeek = Math.max(...Array.from(weeks), selectedWeek) + 1;
    return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => minWeek + i);
  }, [posts, selectedWeek]);

  // Get phase for selected week
  const currentPhase = useMemo(() => {
    return phases.find((p) => selectedWeek >= p.week_start && selectedWeek <= p.week_end);
  }, [phases, selectedWeek]);

  // Get posts for selected week grouped by day
  const postsByDay = useMemo(() => {
    const result: Record<DayOfWeek, CampaignPost[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
    };

    posts
      .filter((p) => p.week_number === selectedWeek)
      .forEach((post) => {
        if (post.day_of_week && result[post.day_of_week]) {
          result[post.day_of_week].push(post);
        }
      });

    // Sort each day's posts by time
    Object.keys(result).forEach((day) => {
      result[day as DayOfWeek].sort((a, b) => {
        const timeA = a.scheduled_time || '00:00';
        const timeB = b.scheduled_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return result;
  }, [posts, selectedWeek]);

  // Calculate date for each day of the week
  const getDateForDay = (dayIndex: number): string => {
    // This is a simplified calculation - in real app would use conference start date
    const baseDate = new Date();
    const currentDayOfWeek = baseDate.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const weekOffset = (selectedWeek - currentWeek) * 7;

    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + mondayOffset + dayIndex + weekOffset);

    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if day is today
  const isToday = (dayIndex: number): boolean => {
    if (selectedWeek !== currentWeek) return false;
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Mon=0
    return dayIndex === adjustedToday;
  };

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => setSelectedWeek((w) => w - 1)}
        />

        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>Week {selectedWeek}</Text>
          {currentPhase && (
            <Chip
              style={[
                styles.phaseChip,
                { backgroundColor: (PHASE_COLORS[currentPhase.name] || '#64748B') + '30' }
              ]}
              textStyle={[
                styles.phaseChipText,
                { color: PHASE_COLORS[currentPhase.name] || '#64748B' }
              ]}
            >
              {currentPhase.name}
            </Chip>
          )}
        </View>

        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => setSelectedWeek((w) => w + 1)}
        />
      </View>

      {/* Week Quick Select */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekSelector}
        contentContainerStyle={styles.weekSelectorContent}
      >
        {weeksWithPosts.map((week) => {
          const weekPosts = posts.filter((p) => p.week_number === week);
          const isSelected = week === selectedWeek;
          const isCurrent = week === currentWeek;

          return (
            <TouchableOpacity
              key={week}
              style={[
                styles.weekButton,
                isSelected && styles.weekButtonSelected,
                isCurrent && !isSelected && styles.weekButtonCurrent,
              ]}
              onPress={() => setSelectedWeek(week)}
            >
              <Text
                style={[
                  styles.weekButtonText,
                  isSelected && styles.weekButtonTextSelected,
                ]}
              >
                W{week}
              </Text>
              {weekPosts.length > 0 && (
                <View style={styles.weekPostCount}>
                  <Text style={styles.weekPostCountText}>{weekPosts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarScroll}>
        <View style={styles.calendar}>
          {DAYS.map((day, index) => {
            const dayPosts = postsByDay[day];
            const today = isToday(index);

            return (
              <View
                key={day}
                style={[styles.dayColumn, today && styles.dayColumnToday]}
              >
                {/* Day Header */}
                <View style={[styles.dayHeader, today && styles.dayHeaderToday]}>
                  <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>
                    {day}
                  </Text>
                  <Text style={[styles.dateLabel, today && styles.dateLabelToday]}>
                    {getDateForDay(index)}
                  </Text>
                </View>

                {/* Posts for this day */}
                <View style={styles.dayContent}>
                  {dayPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={[
                        styles.postItem,
                        { borderLeftColor: STATUS_COLORS[post.status] }
                      ]}
                      onPress={() => onPostPress?.(post)}
                    >
                      {/* Time */}
                      {post.scheduled_time && (
                        <Text style={styles.postTime}>
                          {post.scheduled_time.substring(0, 5)}
                        </Text>
                      )}

                      {/* Author Avatar */}
                      {post.author?.avatar_url ? (
                        <Avatar.Image
                          size={20}
                          source={{ uri: post.author.avatar_url }}
                        />
                      ) : (
                        <Avatar.Text
                          size={20}
                          label={post.author?.full_name?.charAt(0) || '?'}
                          style={{ backgroundColor: STATUS_COLORS[post.status] }}
                          labelStyle={{ fontSize: 10 }}
                        />
                      )}

                      {/* Content Preview */}
                      <Text style={styles.postPreview} numberOfLines={2}>
                        {post.theme || post.content?.substring(0, 50)}
                      </Text>

                      {/* Status Dot */}
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: STATUS_COLORS[post.status] }
                        ]}
                      />
                    </TouchableOpacity>
                  ))}

                  {/* Add Post Button */}
                  {onAddPost && (
                    <TouchableOpacity
                      style={styles.addPostButton}
                      onPress={() => onAddPost(getDateForDay(index), day)}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={16}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  weekInfo: {
    alignItems: 'center',
    gap: 4,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  phaseChip: {
    height: 24,
  },
  phaseChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  weekSelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  weekSelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  weekButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekButtonSelected: {
    backgroundColor: '#0D9488',
  },
  weekButtonCurrent: {
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  weekButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  weekButtonTextSelected: {
    color: '#fff',
  },
  weekPostCount: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  weekPostCountText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  calendarScroll: {
    flex: 1,
  },
  calendar: {
    flexDirection: 'row',
    padding: 8,
    minHeight: 400,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 2,
  },
  dayColumnToday: {
    backgroundColor: '#0D948810',
    borderRadius: 8,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  dayHeaderToday: {
    borderBottomColor: '#0D9488',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dayLabelToday: {
    color: '#0D9488',
  },
  dateLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dateLabelToday: {
    color: '#0D9488',
  },
  dayContent: {
    flex: 1,
    paddingTop: 4,
  },
  postItem: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    gap: 4,
  },
  postTime: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  postPreview: {
    fontSize: 10,
    color: '#CBD5E1',
    lineHeight: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  addPostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'capitalize',
  },
});
