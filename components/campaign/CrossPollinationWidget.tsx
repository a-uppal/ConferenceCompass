import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrossPollinationTask } from '@/types/campaign';

interface CrossPollinationWidgetProps {
  pendingTasks: CrossPollinationTask[];
  urgentTasks: CrossPollinationTask[];
  onCompleteTask: (taskId: string) => void;
  onViewAll?: () => void;
}

export function CrossPollinationWidget({
  pendingTasks,
  urgentTasks,
  onCompleteTask,
  onViewAll,
}: CrossPollinationWidgetProps) {
  const getTimeRemaining = (requiredBy: string): string => {
    const now = new Date();
    const deadline = new Date(requiredBy);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) return 'Overdue!';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isUrgent = (task: CrossPollinationTask): boolean => {
    const now = new Date();
    const deadline = new Date(task.required_by);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining <= 1 && hoursRemaining > 0;
  };

  const isOverdue = (task: CrossPollinationTask): boolean => {
    return new Date(task.required_by) < new Date();
  };

  const handleOpenPost = async (linkedinUrl?: string) => {
    if (linkedinUrl) {
      await Linking.openURL(linkedinUrl);
    }
  };

  if (pendingTasks.length === 0) {
    return (
      <Card style={styles.container}>
        <Card.Title
          title="Cross-Pollination"
          left={(props) => (
            <MaterialCommunityIcons name="account-multiple-check" size={24} color="#10B981" />
          )}
        />
        <Card.Content>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
            <Text style={styles.emptyText}>You're all caught up!</Text>
            <Text style={styles.emptySubtext}>No pending engagement tasks</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title
        title="Cross-Pollination"
        subtitle={`${pendingTasks.length} tasks pending`}
        left={(props) => (
          <MaterialCommunityIcons name="account-multiple" size={24} color="#0D9488" />
        )}
        right={(props) =>
          urgentTasks.length > 0 && (
            <Chip style={styles.urgentBadge} textStyle={styles.urgentBadgeText}>
              {urgentTasks.length} urgent
            </Chip>
          )
        }
      />
      <Card.Content>
        {/* Urgent Tasks First */}
        {urgentTasks.slice(0, 2).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            timeRemaining={getTimeRemaining(task.required_by)}
            isUrgent={true}
            isOverdue={isOverdue(task)}
            onComplete={() => onCompleteTask(task.id)}
            onOpenPost={() => handleOpenPost(task.post?.linkedin_url)}
          />
        ))}

        {/* Other Pending Tasks */}
        {pendingTasks
          .filter((t) => !isUrgent(t) && !isOverdue(t))
          .slice(0, 2)
          .map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              timeRemaining={getTimeRemaining(task.required_by)}
              isUrgent={false}
              isOverdue={false}
              onComplete={() => onCompleteTask(task.id)}
              onOpenPost={() => handleOpenPost(task.post?.linkedin_url)}
            />
          ))}

        {/* The 2-Hour Rule Reminder */}
        <View style={styles.ruleReminder}>
          <MaterialCommunityIcons name="information" size={14} color="#94A3B8" />
          <Text style={styles.ruleText}>
            Comment within 2 hours of posting for maximum LinkedIn algorithm boost
          </Text>
        </View>
      </Card.Content>
      {pendingTasks.length > 4 && (
        <Card.Actions>
          <Button onPress={onViewAll}>
            View All ({pendingTasks.length} tasks)
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

interface TaskCardProps {
  task: CrossPollinationTask;
  timeRemaining: string;
  isUrgent: boolean;
  isOverdue: boolean;
  onComplete: () => void;
  onOpenPost: () => void;
}

function TaskCard({ task, timeRemaining, isUrgent, isOverdue, onComplete, onOpenPost }: TaskCardProps) {
  return (
    <View
      style={[
        styles.taskCard,
        isUrgent && styles.taskCardUrgent,
        isOverdue && styles.taskCardOverdue,
      ]}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskAuthorInfo}>
          {task.post?.author?.avatar_url ? (
            <Avatar.Image size={32} source={{ uri: task.post.author.avatar_url }} />
          ) : (
            <Avatar.Text
              size={32}
              label={task.post?.author?.full_name?.charAt(0) || '?'}
              style={{ backgroundColor: '#0A66C2' }}
            />
          )}
          <View style={styles.taskAuthorMeta}>
            <Text style={styles.taskAuthorName}>
              {task.post?.author?.full_name || 'Team Member'}
            </Text>
            <Text style={styles.taskPostTheme} numberOfLines={1}>
              {task.post?.theme || task.post?.content?.substring(0, 50) || 'LinkedIn Post'}
            </Text>
          </View>
        </View>
        <View style={styles.taskTimeContainer}>
          <MaterialCommunityIcons
            name={isOverdue ? 'alert-circle' : isUrgent ? 'clock-alert' : 'clock-outline'}
            size={14}
            color={isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : '#94A3B8'}
          />
          <Text
            style={[
              styles.taskTime,
              isUrgent && styles.taskTimeUrgent,
              isOverdue && styles.taskTimeOverdue,
            ]}
          >
            {timeRemaining}
          </Text>
        </View>
      </View>

      <View style={styles.taskActions}>
        {task.post?.linkedin_url && (
          <TouchableOpacity style={styles.openPostButton} onPress={onOpenPost}>
            <MaterialCommunityIcons name="linkedin" size={16} color="#0A66C2" />
            <Text style={styles.openPostText}>Open Post</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
          <MaterialCommunityIcons name="check" size={16} color="#10B981" />
          <Text style={styles.completeText}>Mark Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  urgentBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskCardUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    backgroundColor: '#EF444410',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  taskAuthorMeta: {
    flex: 1,
  },
  taskAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  taskPostTheme: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  taskTimeUrgent: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  taskTimeOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  openPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0A66C220',
    borderRadius: 6,
  },
  openPostText: {
    fontSize: 12,
    color: '#0A66C2',
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#10B98120',
    borderRadius: 6,
  },
  completeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  ruleReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  ruleText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 16,
  },
});
