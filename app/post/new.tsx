import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useCampaign } from '@/hooks/useCampaign';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { PostEditor } from '@/components/campaign';
import { CampaignPostInsert } from '@/types/campaign';

export default function NewPostScreen() {
  const params = useLocalSearchParams<{ date?: string; dayOfWeek?: string }>();
  const { activeConference } = useTeam();
  const { user } = useAuth();
  const { phases, isLoading: campaignLoading } = useCampaign();
  const { createPost } = useSocialPosts();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: CampaignPostInsert) => {
    if (!activeConference || !user) {
      Alert.alert('Error', 'No active conference or user');
      return;
    }

    setIsSaving(true);
    try {
      await createPost(data as CampaignPostInsert);
      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
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

  if (campaignLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // Create a partial post object with pre-filled values from params
  const initialPost = {
    scheduled_date: params.date || new Date().toISOString().split('T')[0],
    day_of_week: params.dayOfWeek as any,
  };

  return (
    <View style={styles.container}>
      <PostEditor
        phases={phases}
        conferenceId={activeConference.id}
        authorId={user.id}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isSaving}
        post={initialPost as any}
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
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
});
