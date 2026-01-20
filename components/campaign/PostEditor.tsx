import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Switch,
  Chip,
  HelperText,
  Menu,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CampaignPost,
  CampaignPostInsert,
  CampaignPostUpdate,
  CampaignPhase,
  PostPlatform,
  DayOfWeek,
  PostEditorFormData,
} from '@/types/campaign';

interface PostEditorProps {
  post?: CampaignPost;
  phases: CampaignPhase[];
  conferenceId: string;
  authorId: string;
  onSave: (data: CampaignPostInsert | CampaignPostUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Mon', value: 'Mon' },
  { label: 'Tue', value: 'Tue' },
  { label: 'Wed', value: 'Wed' },
  { label: 'Thu', value: 'Thu' },
  { label: 'Fri', value: 'Fri' },
  { label: 'Sat', value: 'Sat' },
  { label: 'Sun', value: 'Sun' },
];

const PLATFORMS: { label: string; value: PostPlatform; icon: string }[] = [
  { label: 'LinkedIn', value: 'linkedin', icon: 'linkedin' },
  { label: 'Twitter', value: 'twitter', icon: 'twitter' },
  { label: 'Both', value: 'both', icon: 'share-all' },
];

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00',
];

export function PostEditor({
  post,
  phases,
  conferenceId,
  authorId,
  onSave,
  onCancel,
  isLoading = false,
}: PostEditorProps) {
  const [formData, setFormData] = useState<PostEditorFormData>({
    theme: post?.theme || '',
    content: post?.content || '',
    visual_asset: post?.visual_asset || '',
    scheduled_date: post?.scheduled_date || new Date().toISOString().split('T')[0],
    scheduled_time: post?.scheduled_time || '09:00',
    day_of_week: post?.day_of_week,
    week_number: post?.week_number,
    phase_id: post?.phase_id,
    platform: post?.platform || 'linkedin',
    cross_pollination_required: post?.cross_pollination_required ?? true,
    cross_pollination_window_hours: post?.cross_pollination_window_hours || 2,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PostEditorFormData, string>>>({});
  const [phaseMenuVisible, setPhaseMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);

  const isEditing = !!post;

  // Auto-calculate day of week from date
  useEffect(() => {
    if (formData.scheduled_date) {
      const date = new Date(formData.scheduled_date);
      const dayIndex = date.getDay();
      const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      setFormData((prev) => ({ ...prev, day_of_week: days[dayIndex] }));
    }
  }, [formData.scheduled_date]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PostEditorFormData, string>> = {};

    if (!formData.content.trim()) {
      newErrors.content = 'Post content is required';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const saveData: CampaignPostInsert | CampaignPostUpdate = isEditing
      ? {
          theme: formData.theme || undefined,
          content: formData.content,
          content_preview: formData.content.substring(0, 150),
          visual_asset: formData.visual_asset || undefined,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          day_of_week: formData.day_of_week,
          week_number: formData.week_number,
          phase_id: formData.phase_id,
          platform: formData.platform,
          cross_pollination_required: formData.cross_pollination_required,
          cross_pollination_window_hours: formData.cross_pollination_window_hours,
        }
      : {
          conference_id: conferenceId,
          author_id: authorId,
          theme: formData.theme || undefined,
          content: formData.content,
          content_preview: formData.content.substring(0, 150),
          visual_asset: formData.visual_asset || undefined,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          day_of_week: formData.day_of_week,
          week_number: formData.week_number,
          phase_id: formData.phase_id,
          platform: formData.platform,
          status: 'draft',
          cross_pollination_required: formData.cross_pollination_required,
          cross_pollination_window_hours: formData.cross_pollination_window_hours,
        };

    await onSave(saveData);
  };

  const selectedPhase = phases.find((p) => p.id === formData.phase_id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Theme */}
        <View style={styles.field}>
          <Text style={styles.label}>Theme / Hook</Text>
          <TextInput
            mode="outlined"
            placeholder="e.g., Data Quality Problem"
            value={formData.theme}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, theme: text }))}
            style={styles.input}
            outlineColor="#334155"
            activeOutlineColor="#0D9488"
          />
          <HelperText type="info">
            A short descriptor for this post's main message
          </HelperText>
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={styles.label}>Post Content *</Text>
          <TextInput
            mode="outlined"
            placeholder="Write your post content here..."
            value={formData.content}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, content: text }))}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.contentInput]}
            outlineColor="#334155"
            activeOutlineColor="#0D9488"
            error={!!errors.content}
          />
          {errors.content && <HelperText type="error">{errors.content}</HelperText>}
          <Text style={styles.charCount}>{formData.content.length} / 3000 characters</Text>
        </View>

        {/* Platform */}
        <View style={styles.field}>
          <Text style={styles.label}>Platform</Text>
          <SegmentedButtons
            value={formData.platform}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, platform: value as PostPlatform }))
            }
            buttons={PLATFORMS.map((p) => ({
              value: p.value,
              label: p.label,
              icon: p.icon,
            }))}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Phase Selection */}
        <View style={styles.field}>
          <Text style={styles.label}>Campaign Phase</Text>
          <Menu
            visible={phaseMenuVisible}
            onDismiss={() => setPhaseMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPhaseMenuVisible(true)}
                style={styles.dropdownButton}
                contentStyle={styles.dropdownButtonContent}
                icon="chevron-down"
              >
                {selectedPhase?.name || 'Select Phase'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setFormData((prev) => ({ ...prev, phase_id: undefined }));
                setPhaseMenuVisible(false);
              }}
              title="No Phase"
            />
            <Divider />
            {phases.map((phase) => (
              <Menu.Item
                key={phase.id}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, phase_id: phase.id }));
                  setPhaseMenuVisible(false);
                }}
                title={`${phase.name} (W${phase.week_start}-${phase.week_end})`}
              />
            ))}
          </Menu>
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={formData.scheduled_date}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, scheduled_date: text }))
              }
              style={styles.input}
              outlineColor="#334155"
              activeOutlineColor="#0D9488"
              error={!!errors.scheduled_date}
            />
          </View>

          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Time</Text>
            <Menu
              visible={timeMenuVisible}
              onDismiss={() => setTimeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setTimeMenuVisible(true)}
                  style={styles.dropdownButton}
                  contentStyle={styles.dropdownButtonContent}
                >
                  {formData.scheduled_time || 'Select'}
                </Button>
              }
            >
              {TIME_SLOTS.map((time) => (
                <Menu.Item
                  key={time}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, scheduled_time: time }));
                    setTimeMenuVisible(false);
                  }}
                  title={time}
                />
              ))}
            </Menu>
          </View>
        </View>

        {/* Week Number */}
        <View style={styles.field}>
          <Text style={styles.label}>Week Number</Text>
          <TextInput
            mode="outlined"
            placeholder="e.g., 1, 2, 3..."
            value={formData.week_number?.toString() || ''}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                week_number: text ? parseInt(text) : undefined
              }))
            }
            keyboardType="number-pad"
            style={styles.input}
            outlineColor="#334155"
            activeOutlineColor="#0D9488"
          />
          <HelperText type="info">
            Relative to conference start (1 = first week of campaign)
          </HelperText>
        </View>

        {/* Day of Week Display */}
        {formData.day_of_week && (
          <View style={styles.field}>
            <Text style={styles.label}>Day of Week</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => (
                <Chip
                  key={day.value}
                  selected={formData.day_of_week === day.value}
                  style={[
                    styles.dayChip,
                    formData.day_of_week === day.value && styles.dayChipSelected,
                  ]}
                  textStyle={[
                    styles.dayChipText,
                    formData.day_of_week === day.value && styles.dayChipTextSelected,
                  ]}
                >
                  {day.label}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Visual Asset */}
        <View style={styles.field}>
          <Text style={styles.label}>Visual Asset</Text>
          <TextInput
            mode="outlined"
            placeholder="Description or URL of visual"
            value={formData.visual_asset}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, visual_asset: text }))
            }
            style={styles.input}
            outlineColor="#334155"
            activeOutlineColor="#0D9488"
          />
        </View>

        {/* Cross-Pollination Settings */}
        <View style={styles.crossPollSection}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#0D9488" />
              <Text style={styles.switchText}>Require Cross-Pollination</Text>
            </View>
            <Switch
              value={formData.cross_pollination_required}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, cross_pollination_required: value }))
              }
              color="#0D9488"
            />
          </View>

          {formData.cross_pollination_required && (
            <View style={styles.windowRow}>
              <Text style={styles.windowLabel}>Comment window:</Text>
              <SegmentedButtons
                value={formData.cross_pollination_window_hours.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    cross_pollination_window_hours: parseInt(value),
                  }))
                }
                buttons={[
                  { value: '1', label: '1 hr' },
                  { value: '2', label: '2 hrs' },
                  { value: '4', label: '4 hrs' },
                ]}
                style={styles.windowButtons}
              />
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Update Post' : 'Create Post'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
  },
  contentInput: {
    minHeight: 150,
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  segmentedButtons: {
    backgroundColor: '#1E293B',
  },
  dropdownButton: {
    borderColor: '#334155',
  },
  dropdownButtonContent: {
    flexDirection: 'row-reverse',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: '#334155',
  },
  dayChipSelected: {
    backgroundColor: '#0D9488',
  },
  dayChipText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  dayChipTextSelected: {
    color: '#fff',
  },
  crossPollSection: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  windowRow: {
    marginTop: 16,
  },
  windowLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  windowButtons: {
    backgroundColor: '#334155',
  },
  bottomPadding: {
    height: 100,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#334155',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#0D9488',
  },
});
