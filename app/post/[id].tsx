import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useCampaign } from '@/hooks/useCampaign';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { PostEditor } from '@/components/campaign';
import { CampaignPost, CampaignPostUpdate } from '@/types/campaign';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeConference } = useTeam();
  const { user } = useAuth();
  const { phases, isLoading: campaignLoading } = useCampaign();
  const { posts, updatePost, isLoading: postsLoading } = useSocialPosts();

  const [isSaving, setIsSaving] = useState(false);
  const [post, setPost] = useState<CampaignPost | null>(null);

  // Find the post from the posts array
  useEffect(() => {
    if (id && posts.length > 0) {
      const foundPost = posts.find((p) => p.id === id);
      setPost(foundPost || null);
    }
  }, [id, posts]);

  const handleSave = async (data: CampaignPostUpdate) => {
    if (!post) {
      Alert.alert('Error', 'Post not found');
      return;
    }

    setIsSaving(true);
    try {
      await updatePost(post.id, data as CampaignPostUpdate);
      Alert.alert('Success', 'Post updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Error updating post:', err);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!activeConference || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No active conference or user</Text>
      </View>
    );
  }

  if (campaignLoading || postsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  // Check if user owns this post
  const isOwner = post.author_id === user.id;
  if (!isOwner) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>You can only edit your own posts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PostEditor
        post={post}
        phases={phases}
        conferenceId={activeConference.id}
        authorId={user.id}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
});
