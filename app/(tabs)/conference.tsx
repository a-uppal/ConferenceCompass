import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useConferenceSchedule } from '@/hooks/useConferenceSchedule';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import { ConferenceScheduleSlot, CampaignPostInsert } from '@/types/campaign';

// Conference day hours (typically 8 AM to 8 PM)
const CONFERENCE_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

// Hour slot component
function HourSlot({
  hour,
  slots,
  onSlotPress,
  onAddPost,
}: {
  hour: number;
  slots: ConferenceScheduleSlot[];
  onSlotPress: (slot: ConferenceScheduleSlot) => void;
  onAddPost: (hour: number) => void;
}) {
  const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:00 ${suffix}`;
  };

  const slotsForHour = slots.filter((s) => {
    const slotHour = parseInt(s.schedule_time.split(':')[0], 10);
    return slotHour === hour;
  });

  return (
    <View style={styles.hourSlot}>
      <View style={styles.hourLabel}>
        <Text style={styles.hourText}>{formatHour(hour)}</Text>
      </View>
      <View style={styles.hourContent}>
        {slotsForHour.length > 0 ? (
          slotsForHour.map((slot) => (
            <Pressable
              key={slot.id}
              onPress={() => onSlotPress(slot)}
              style={[
                styles.slotCard,
                slot.actual_post_id ? styles.slotFilled : styles.slotEmpty,
              ]}
            >
              <View style={styles.slotHeader}>
                <Text style={styles.slotType}>{slot.post_type}</Text>
                {slot.actual_post_id ? (
                  <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                ) : (
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
                )}
              </View>
              {slot.content_summary && (
                <Text style={styles.slotSummary} numberOfLines={2}>
                  {slot.content_summary}
                </Text>
              )}
              {slot.owner && (
                <Text style={styles.slotOwner}>{slot.owner.full_name}</Text>
              )}
            </Pressable>
          ))
        ) : (
          <Pressable
            style={styles.emptySlot}
            onPress={() => onAddPost(hour)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#64748B" />
            <Text style={styles.emptySlotText}>Add Post</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Quick Post Modal component
function QuickPostModal({
  visible,
  onDismiss,
  onSubmit,
  slot,
  isLoading,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (content: string, imageUri?: string) => Promise<void>;
  slot?: ConferenceScheduleSlot | null;
  isLoading: boolean;
}) {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please enter post content.');
      return;
    }

    await onSubmit(content, imageUri || undefined);
    setContent('');
    setImageUri(null);
  };

  const handleClose = () => {
    setContent('');
    setImageUri(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Quick Post</Text>
          <IconButton icon="close" iconColor="#94A3B8" onPress={handleClose} />
        </View>

        {slot && (
          <View style={styles.slotInfo}>
            <Chip icon="clock" style={styles.infoChip}>
              {slot.schedule_time}
            </Chip>
            <Chip icon="tag" style={styles.infoChip}>
              {slot.post_type}
            </Chip>
          </View>
        )}

        {slot?.content_summary && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionLabel}>Suggested Content:</Text>
            <Text style={styles.suggestionText}>{slot.content_summary}</Text>
            <Button
              mode="text"
              onPress={() => setContent(slot.content_summary || '')}
              labelStyle={{ color: '#0D9488', fontSize: 12 }}
            >
              Use This
            </Button>
          </View>
        )}

        <TextInput
          mode="outlined"
          label="Post Content"
          placeholder="What's happening at the conference?"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          style={styles.contentInput}
          outlineColor="#334155"
          activeOutlineColor="#0D9488"
          textColor="#F8FAFC"
        />

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <IconButton
              icon="close-circle"
              iconColor="#EF4444"
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            />
          </View>
        )}

        {/* Photo Actions */}
        <View style={styles.photoActions}>
          <Button
            mode="outlined"
            icon="camera"
            onPress={handleTakePhoto}
            style={styles.photoButton}
            labelStyle={styles.photoButtonLabel}
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={handlePickImage}
            style={styles.photoButton}
            labelStyle={styles.photoButtonLabel}
          >
            Gallery
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading || !content.trim()}
          style={styles.submitButton}
        >
          Create Post
        </Button>
      </Modal>
    </Portal>
  );
}

// Slot Detail Modal
function SlotDetailModal({
  visible,
  onDismiss,
  slot,
  onQuickPost,
  onViewPost,
}: {
  visible: boolean;
  onDismiss: () => void;
  slot: ConferenceScheduleSlot | null;
  onQuickPost: () => void;
  onViewPost: () => void;
}) {
  if (!slot) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Schedule Slot</Text>
          <IconButton icon="close" iconColor="#94A3B8" onPress={onDismiss} />
        </View>

        <View style={styles.slotDetailRow}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#94A3B8" />
          <Text style={styles.slotDetailText}>{slot.schedule_time}</Text>
        </View>

        <View style={styles.slotDetailRow}>
          <MaterialCommunityIcons name="tag" size={20} color="#94A3B8" />
          <Text style={styles.slotDetailText}>{slot.post_type}</Text>
        </View>

        {slot.owner && (
          <View style={styles.slotDetailRow}>
            <MaterialCommunityIcons name="account" size={20} color="#94A3B8" />
            <Text style={styles.slotDetailText}>{slot.owner.full_name}</Text>
          </View>
        )}

        {slot.content_summary && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Content Summary</Text>
            <Text style={styles.detailContent}>{slot.content_summary}</Text>
          </View>
        )}

        {slot.visual_suggestion && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Visual Suggestion</Text>
            <Text style={styles.detailContent}>{slot.visual_suggestion}</Text>
          </View>
        )}

        <View style={styles.detailActions}>
          {slot.actual_post_id ? (
            <Button
              mode="contained"
              icon="eye"
              onPress={onViewPost}
              style={styles.detailButton}
            >
              View Post
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="plus"
              onPress={onQuickPost}
              style={styles.detailButton}
            >
              Create Post
            </Button>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

export default function ConferenceModeScreen() {
  const { activeConference, isLoading: teamLoading } = useTeam();
  const { user } = useAuth();
  const {
    slots,
    slotsByDay,
    todaySlots,
    isLoading: scheduleLoading,
    refreshSchedule,
    linkPostToSlot,
    isConferenceDay,
  } = useConferenceSchedule();
  const { createPost } = useSocialPosts();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [selectedSlot, setSelectedSlot] = useState<ConferenceScheduleSlot | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [quickPostModalVisible, setQuickPostModalVisible] = useState(false);
  const [quickPostHour, setQuickPostHour] = useState<number | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Get conference days
  const conferenceDays = useMemo(() => {
    if (!activeConference) return [];

    const days: { value: string; label: string }[] = [{ value: 'today', label: 'Today' }];

    // Add each conference day
    const start = new Date(activeConference.start_date);
    const end = new Date(activeConference.end_date);
    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = current.getDate();
      days.push({ value: dateStr, label: `${dayName} ${dayNum}` });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [activeConference]);

  // Get slots for selected day
  const displaySlots = useMemo(() => {
    if (selectedDay === 'today') {
      return todaySlots;
    }
    return slots.filter((s) => s.schedule_day === selectedDay);
  }, [selectedDay, todaySlots, slots]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSchedule();
    setRefreshing(false);
  }, [refreshSchedule]);

  const handleSlotPress = (slot: ConferenceScheduleSlot) => {
    setSelectedSlot(slot);
    setDetailModalVisible(true);
  };

  const handleAddPost = (hour: number) => {
    setQuickPostHour(hour);
    setSelectedSlot(null);
    setQuickPostModalVisible(true);
  };

  const handleQuickPostFromSlot = () => {
    setDetailModalVisible(false);
    setQuickPostModalVisible(true);
  };

  const handleViewPost = () => {
    // TODO: Navigate to post detail
    setDetailModalVisible(false);
    Alert.alert('View Post', 'Post detail view coming soon!');
  };

  const handleSubmitQuickPost = async (content: string, imageUri?: string) => {
    if (!activeConference || !user) return;

    setIsCreatingPost(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const postData: CampaignPostInsert = {
        conference_id: activeConference.id,
        author_id: user.id,
        scheduled_date: selectedDay === 'today' ? today : selectedDay,
        scheduled_time: quickPostHour
          ? `${quickPostHour.toString().padStart(2, '0')}:00`
          : selectedSlot?.schedule_time,
        content,
        visual_asset: imageUri,
        status: 'draft',
        post_type: selectedSlot?.post_type || 'Conference Update',
        theme: selectedSlot?.post_type || 'Conference',
        platform: 'linkedin',
        cross_pollination_required: true,
        cross_pollination_window_hours: 2,
      };

      const newPost = await createPost(postData);

      // Link to slot if we have one
      if (selectedSlot) {
        await linkPostToSlot(selectedSlot.id, newPost.id);
      }

      setQuickPostModalVisible(false);
      Alert.alert('Success', 'Post created! Don\'t forget to publish it to LinkedIn.');
    } catch (err) {
      console.error('Error creating quick post:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Show conference selector if no conference is active
  if (!activeConference && !teamLoading) {
    return <ConferenceSelector />;
  }

  // Check if we're in conference mode
  const inConferenceMode = isConferenceDay();

  return (
    <View style={styles.container}>
      {/* Conference Mode Header */}
      <View style={styles.header}>
        {inConferenceMode ? (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CONFERENCE LIVE</Text>
          </View>
        ) : (
          <View style={styles.previewIndicator}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#94A3B8" />
            <Text style={styles.previewText}>Conference Schedule Preview</Text>
          </View>
        )}
      </View>

      {/* Day Selector */}
      {conferenceDays.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {conferenceDays.map((day) => (
            <Chip
              key={day.value}
              selected={selectedDay === day.value}
              onPress={() => setSelectedDay(day.value)}
              style={[
                styles.dayChip,
                selectedDay === day.value && styles.dayChipSelected,
              ]}
              textStyle={[
                styles.dayChipText,
                selectedDay === day.value && styles.dayChipTextSelected,
              ]}
            >
              {day.label}
            </Chip>
          ))}
        </ScrollView>
      )}

      {/* Hour-by-Hour Timeline */}
      <ScrollView
        style={styles.timeline}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D9488"
            colors={['#0D9488']}
          />
        }
      >
        {CONFERENCE_HOURS.map((hour) => (
          <HourSlot
            key={hour}
            hour={hour}
            slots={displaySlots}
            onSlotPress={handleSlotPress}
            onAddPost={handleAddPost}
          />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB for quick post */}
      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => {
          setSelectedSlot(null);
          setQuickPostHour(new Date().getHours());
          setQuickPostModalVisible(true);
        }}
        color="#fff"
        label={inConferenceMode ? 'Post Now' : 'Quick Post'}
      />

      {/* Modals */}
      <SlotDetailModal
        visible={detailModalVisible}
        onDismiss={() => setDetailModalVisible(false)}
        slot={selectedSlot}
        onQuickPost={handleQuickPostFromSlot}
        onViewPost={handleViewPost}
      />

      <QuickPostModal
        visible={quickPostModalVisible}
        onDismiss={() => setQuickPostModalVisible(false)}
        onSubmit={handleSubmitQuickPost}
        slot={selectedSlot}
        isLoading={isCreatingPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
  previewIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  daySelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dayChip: {
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  dayChipSelected: {
    backgroundColor: '#0D9488',
  },
  dayChipText: {
    color: '#94A3B8',
  },
  dayChipTextSelected: {
    color: '#fff',
  },
  timeline: {
    flex: 1,
  },
  hourSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    minHeight: 80,
  },
  hourLabel: {
    width: 70,
    padding: 8,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  hourText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  hourContent: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  slotCard: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  slotFilled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  slotEmpty: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  slotSummary: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  slotOwner: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptySlotText: {
    fontSize: 12,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0D9488',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  slotInfo: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoChip: {
    backgroundColor: '#334155',
  },
  suggestionBox: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  contentInput: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#0F172A',
  },
  imagePreviewContainer: {
    margin: 16,
    marginTop: 8,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1E293B',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  photoButton: {
    flex: 1,
    borderColor: '#334155',
  },
  photoButtonLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  submitButton: {
    margin: 16,
    backgroundColor: '#0D9488',
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  slotDetailText: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  detailSection: {
    padding: 16,
    paddingTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailContent: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  detailActions: {
    padding: 16,
    paddingTop: 8,
  },
  detailButton: {
    backgroundColor: '#0D9488',
  },
});
