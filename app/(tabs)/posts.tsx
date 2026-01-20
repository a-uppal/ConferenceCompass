import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, SegmentedButtons, FAB, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useCampaign } from '@/hooks/useCampaign';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useCrossPollination } from '@/hooks/useCrossPollination';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import {
  PostCard,
  PostCalendarView,
  PostDetailModal,
} from '@/components/campaign';
import { CampaignPost, PostStatus } from '@/types/campaign';

type ViewMode = 'list' | 'calendar';
type FilterStatus = 'all' | 'draft' | 'scheduled' | 'posted';

export default function PostsScreen() {
  const { activeConference, isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const { phases, getCurrentWeek } = useCampaign();
  const {
    posts,
    isLoading: postsLoading,
    refreshPosts,
    updatePost,
    deletePost,
    markAsPosted,
  } = useSocialPosts();
  const { tasks: crossPollinationTasks } = useCrossPollination();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CampaignPost | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const currentWeek = getCurrentWeek();

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'posted' && post.status !== 'posted' && post.status !== 'published') {
        return false;
      }
      if (filterStatus !== 'posted' && post.status !== filterStatus) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = post.content?.toLowerCase().includes(query);
      const matchesTheme = post.theme?.toLowerCase().includes(query);
      const matchesAuthor = post.author?.full_name?.toLowerCase().includes(query);
      if (!matchesContent && !matchesTheme && !matchesAuthor) {
        return false;
      }
    }

    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const handlePostPress = (post: CampaignPost) => {
    setSelectedPost(post);
    setDetailModalVisible(true);
  };

  const handleEditPost = (post: CampaignPost) => {
    setDetailModalVisible(false);
    router.push(`/post/${post.id}`);
  };

  const handleMarkPosted = async (post: CampaignPost) => {
    Alert.prompt(
      'Mark as Posted',
      'Enter the LinkedIn post URL (optional):',
      async (url) => {
        try {
          await markAsPosted(post.id, url || undefined);
          setDetailModalVisible(false);
          Alert.alert('Success', 'Post marked as posted!');
        } catch (err) {
          Alert.alert('Error', 'Failed to update post status');
        }
      },
      'plain-text',
      '',
      'url'
    );
  };

  const handleSkipPost = async (post: CampaignPost) => {
    Alert.alert(
      'Skip Post',
      'Are you sure you want to skip this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await updatePost(post.id, { status: 'skipped' });
              setDetailModalVisible(false);
            } catch (err) {
              Alert.alert('Error', 'Failed to skip post');
            }
          },
        },
      ]
    );
  };

  const handleDeletePost = async (post: CampaignPost) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              setDetailModalVisible(false);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleAddPostFromCalendar = (date: string, dayOfWeek: string) => {
    router.push({
      pathname: '/post/new',
      params: { date, dayOfWeek },
    });
  };

  // Get cross-pollination tasks for selected post
  const selectedPostTasks = selectedPost
    ? crossPollinationTasks.filter((t) => t.post_id === selectedPost.id)
    : [];

  // Show conference selector if no conference is active
  if (!activeConference && !teamLoading) {
    return <ConferenceSelector />;
  }

  const renderListView = () => (
    <FlatList
      data={filteredPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => handlePostPress(item)}
          onEdit={() => handleEditPost(item)}
          onDelete={() => handleDeletePost(item)}
          onMarkPosted={() => handleMarkPosted(item)}
          onSkip={() => handleSkipPost(item)}
          showActions={item.author_id === user?.id}
        />
      )}
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
          <MaterialCommunityIcons name="post-outline" size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>No Posts Found</Text>
          <Text style={styles.emptyText}>
            {filterStatus !== 'all' || searchQuery
              ? 'Try adjusting your filters or search query'
              : 'Tap + to create your first post'}
          </Text>
        </View>
      }
    />
  );

  const renderCalendarView = () => (
    <PostCalendarView
      posts={posts}
      phases={phases}
      currentWeek={currentWeek}
      onPostPress={handlePostPress}
      onAddPost={handleAddPostFromCalendar}
    />
  );

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.controls}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          buttons={[
            { value: 'list', label: 'List', icon: 'view-list' },
            { value: 'calendar', label: 'Calendar', icon: 'calendar-month' },
          ]}
          style={styles.segmented}
        />
      </View>

      {/* Search & Filters (List View Only) */}
      {viewMode === 'list' && (
        <>
          <Searchbar
            placeholder="Search posts..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#94A3B8"
            placeholderTextColor="#64748B"
          />

          <View style={styles.filterRow}>
            <Chip
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipSelected]}
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              showSelectedOverlay={false}
            >
              All ({posts.length})
            </Chip>
            <Chip
              style={[styles.filterChip, filterStatus === 'draft' && styles.filterChipSelected]}
              selected={filterStatus === 'draft'}
              onPress={() => setFilterStatus('draft')}
              showSelectedOverlay={false}
            >
              Drafts
            </Chip>
            <Chip
              style={[styles.filterChip, filterStatus === 'scheduled' && styles.filterChipSelected]}
              selected={filterStatus === 'scheduled'}
              onPress={() => setFilterStatus('scheduled')}
              showSelectedOverlay={false}
            >
              Scheduled
            </Chip>
            <Chip
              style={[styles.filterChip, filterStatus === 'posted' && styles.filterChipSelected]}
              selected={filterStatus === 'posted'}
              onPress={() => setFilterStatus('posted')}
              showSelectedOverlay={false}
            >
              Posted
            </Chip>
          </View>
        </>
      )}

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderCalendarView()}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/post/new')}
        color="#fff"
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        visible={detailModalVisible}
        post={selectedPost}
        crossPollinationTasks={selectedPostTasks}
        onClose={() => setDetailModalVisible(false)}
        onEdit={() => selectedPost && handleEditPost(selectedPost)}
        onMarkPosted={() => selectedPost && handleMarkPosted(selectedPost)}
        onSkip={() => selectedPost && handleSkipPost(selectedPost)}
        onDelete={() => selectedPost && handleDeletePost(selectedPost)}
      />
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
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  searchInput: {
    color: '#F8FAFC',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
  },
  filterChipSelected: {
    backgroundColor: '#0D9488',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0D9488',
  },
});
