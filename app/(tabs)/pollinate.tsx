import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Linking } from 'react-native';
import { Text, Card, Button, Chip, Badge, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useCrossPollination } from '@/hooks/useCrossPollination';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import { CrossPollinationTask, CrossPollinationComplete } from '@/types/campaign';

// Countdown timer component
function CountdownTimer({ targetDate, onExpired }: { targetDate: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        setIsUrgent(false);
        onExpired?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(hours < 1);
      setIsExpired(false);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  return (
    <View style={[styles.timer, isUrgent && styles.timerUrgent, isExpired && styles.timerExpired]}>
      <MaterialCommunityIcons
        name={isExpired ? 'timer-off' : 'timer-outline'}
        size={16}
        color={isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981'}
      />
      <Text
        style={[
          styles.timerText,
          isUrgent && styles.timerTextUrgent,
          isExpired && styles.timerTextExpired,
        ]}
      >
        {timeLeft}
      </Text>
    </View>
  );
}

// Task card component
function TaskCard({
  task,
  onComplete,
  onViewPost,
}: {
  task: CrossPollinationTask;
  onComplete: (task: CrossPollinationTask) => void;
  onViewPost: (task: CrossPollinationTask) => void;
}) {
  const postContent = task.post?.content || 'No content available';
  const authorName = task.post?.author?.full_name || 'Unknown';
  const truncatedContent =
    postContent.length > 150 ? postContent.substring(0, 150) + '...' : postContent;

  return (
    <Card style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskAuthor}>
            <MaterialCommunityIcons name="account-circle" size={32} color="#0D9488" />
            <View style={styles.taskAuthorInfo}>
              <Text style={styles.taskAuthorName}>{authorName}</Text>
              <Text style={styles.taskTheme}>{task.post?.theme || 'Post'}</Text>
            </View>
          </View>
          <CountdownTimer targetDate={task.required_by} />
        </View>

        <Text style={styles.taskContent}>{truncatedContent}</Text>

        <View style={styles.taskActions}>
          <Button
            mode="outlined"
            onPress={() => onViewPost(task)}
            style={styles.viewButton}
            labelStyle={styles.buttonLabel}
            icon="linkedin"
          >
            View Post
          </Button>
          <Button
            mode="contained"
            onPress={() => onComplete(task)}
            style={styles.completeButton}
            labelStyle={styles.buttonLabel}
            icon="check"
          >
            Mark Complete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

// Stats card component
function StatsCard({
  total,
  completed,
  missed,
  pending,
}: {
  total: number;
  completed: number;
  missed: number;
  pending: number;
}) {
  const completionRate = total > 0 ? completed / total : 0;

  return (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text style={styles.statsTitle}>Cross-Pollination Stats</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Completion Rate: {Math.round(completionRate * 100)}%
          </Text>
          <ProgressBar
            progress={completionRate}
            color={completionRate >= 0.8 ? '#10B981' : completionRate >= 0.5 ? '#F59E0B' : '#EF4444'}
            style={styles.progressBar}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

// Comment suggestions component
function CommentSuggestions({ post, onSelect }: { post: any; onSelect: (text: string) => void }) {
  const suggestions = [
    `Great insights on ${post?.theme || 'this topic'}! Looking forward to discussing at #LotF2026`,
    `This resonates with what we're seeing in the field. The compass metaphor is powerful.`,
    `Spot on! The ${post?.theme || 'data'} challenge is something every org needs to address.`,
    `Can't wait to connect and discuss this further in Boston!`,
  ];

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Quick Comments:</Text>
      <View style={styles.suggestionsList}>
        {suggestions.map((text, index) => (
          <Chip
            key={index}
            onPress={() => onSelect(text)}
            style={styles.suggestionChip}
            textStyle={styles.suggestionText}
          >
            {text.substring(0, 40)}...
          </Chip>
        ))}
      </View>
    </View>
  );
}

export default function PollinateScreen() {
  const { activeConference, isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const {
    tasks,
    myPendingTasks,
    urgentTasks,
    isLoading,
    completeTask,
    refreshTasks,
    checkAndUpdateMissedTasks,
  } = useCrossPollination();

  const [refreshing, setRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  // Filter tasks by status
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const missedTasks = tasks.filter((t) => t.status === 'missed');

  // Sort by urgency (nearest deadline first)
  const sortedPendingTasks = [...myPendingTasks].sort(
    (a, b) => new Date(a.required_by).getTime() - new Date(b.required_by).getTime()
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkAndUpdateMissedTasks();
    await refreshTasks();
    setRefreshing(false);
  }, [refreshTasks, checkAndUpdateMissedTasks]);

  const handleViewPost = (task: CrossPollinationTask) => {
    if (task.post?.linkedin_url) {
      Linking.openURL(task.post.linkedin_url);
    } else {
      Alert.alert(
        'Post Not Published',
        'This post has not been published to LinkedIn yet. The author needs to post it first.'
      );
    }
  };

  const handleComplete = (task: CrossPollinationTask) => {
    if (!task.post?.linkedin_url) {
      Alert.alert(
        'Post Not Published',
        'Cannot complete task - the post has not been published to LinkedIn yet.'
      );
      return;
    }

    setShowSuggestions(task.id);
  };

  const handleCompleteWithComment = async (task: CrossPollinationTask, commentText?: string) => {
    try {
      const completeData: CrossPollinationComplete = {
        comment_text: commentText,
      };

      await completeTask(task.id, completeData);
      setShowSuggestions(null);
      Alert.alert('Success', 'Task marked as complete!');
    } catch (err) {
      console.error('Error completing task:', err);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  // Show conference selector if no conference is active
  if (!activeConference && !teamLoading) {
    return <ConferenceSelector />;
  }

  const renderTaskItem = ({ item }: { item: CrossPollinationTask }) => (
    <View>
      <TaskCard task={item} onComplete={handleComplete} onViewPost={handleViewPost} />
      {showSuggestions === item.id && (
        <Card style={styles.suggestionsCard}>
          <Card.Content>
            <CommentSuggestions
              post={item.post}
              onSelect={(text) => handleCompleteWithComment(item, text)}
            />
            <View style={styles.completeActions}>
              <Button
                mode="text"
                onPress={() => setShowSuggestions(null)}
                labelStyle={{ color: '#94A3B8' }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => handleCompleteWithComment(item)}
                style={styles.completeButton}
              >
                Complete Without Comment
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <StatsCard
        total={tasks.length}
        completed={completedTasks.length}
        missed={missedTasks.length}
        pending={pendingTasks.length}
      />

      {/* Urgent Alert */}
      {urgentTasks.length > 0 && (
        <View style={styles.urgentAlert}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#F59E0B" />
          <Text style={styles.urgentText}>
            {urgentTasks.length} task{urgentTasks.length > 1 ? 's' : ''} due within 1 hour!
          </Text>
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Task List */}
      <Text style={styles.sectionTitle}>
        Your Pending Tasks ({myPendingTasks.length})
      </Text>

      <FlatList
        data={sortedPendingTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D9488"
            colors={['#0D9488']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              You have no pending cross-pollination tasks. When a teammate posts, you'll see tasks
              here to comment within 2 hours.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1E293B',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  urgentText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskAuthorInfo: {
    gap: 2,
  },
  taskAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  taskTheme: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  timerExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  timerTextUrgent: {
    color: '#F59E0B',
  },
  timerTextExpired: {
    color: '#EF4444',
  },
  taskContent: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 16,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    borderColor: '#0A66C2',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  buttonLabel: {
    fontSize: 12,
  },
  suggestionsCard: {
    backgroundColor: '#1E293B',
    marginBottom: 12,
    marginTop: -8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#334155',
  },
  suggestionText: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  completeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
