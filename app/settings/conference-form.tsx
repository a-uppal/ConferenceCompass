import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';

export default function ConferenceFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    conferences,
    activeTeam,
    createConference,
    updateConference,
    isLoading,
  } = useTeam();

  const isEditing = !!id;
  const existingConference = isEditing
    ? conferences.find((c) => c.id === id)
    : null;

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing conference data
  useEffect(() => {
    if (existingConference) {
      setName(existingConference.name);
      setLocation(existingConference.location || '');
      setDescription(existingConference.description || '');
      setWebsiteUrl(existingConference.website_url || '');
      setStartDateStr(existingConference.start_date);
      setEndDateStr(existingConference.end_date);
    } else {
      // Set default dates to today and tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDateStr(formatDateForInput(today));
      setEndDateStr(formatDateForInput(tomorrow));
    }
  }, [existingConference]);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr: string): Date | null => {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const formatDateDisplay = (dateStr: string): string => {
    const date = parseDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Conference name is required';
    }

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate) {
      newErrors.startDate = 'Please enter a valid date (YYYY-MM-DD)';
    }

    if (!endDate) {
      newErrors.endDate = 'Please enter a valid date (YYYY-MM-DD)';
    }

    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!activeTeam) {
      Alert.alert('Error', 'No team selected');
      return;
    }

    setIsSaving(true);

    try {
      const conferenceData = {
        name: name.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        start_date: startDateStr,
        end_date: endDateStr,
        team_id: activeTeam.id,
      };

      if (isEditing && id) {
        await updateConference(id, conferenceData);
        Alert.alert('Success', 'Conference updated successfully');
      } else {
        await createConference(conferenceData);
        Alert.alert('Success', 'Conference created successfully');
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save conference');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (text: string, isStart: boolean) => {
    // Allow only numbers and dashes, auto-format as YYYY-MM-DD
    let cleaned = text.replace(/[^\d-]/g, '');

    // Auto-add dashes
    if (cleaned.length === 4 && !cleaned.includes('-')) {
      cleaned += '-';
    } else if (cleaned.length === 7 && cleaned.split('-').length === 2) {
      cleaned += '-';
    }

    // Limit length
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }

    if (isStart) {
      setStartDateStr(cleaned);
      // Auto-adjust end date if needed
      const startDate = parseDate(cleaned);
      const endDate = parseDate(endDateStr);
      if (startDate && endDate && endDate < startDate) {
        setEndDateStr(cleaned);
      }
    } else {
      setEndDateStr(cleaned);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.form}>
        <Text variant="titleLarge" style={styles.title}>
          {isEditing ? 'Edit Conference' : 'New Conference'}
        </Text>

        <TextInput
          label="Conference Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          placeholder="e.g., BioTech Summit 2026"
        />
        {errors.name && (
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>
        )}

        <TextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., San Francisco, CA"
          left={<TextInput.Icon icon="map-marker" />}
        />

        <View style={styles.dateSection}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Conference Dates
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TextInput
                label="Start Date *"
                value={startDateStr}
                onChangeText={(text) => handleDateChange(text, true)}
                mode="outlined"
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
                error={!!errors.startDate}
                left={<TextInput.Icon icon="calendar" />}
              />
              {startDateStr && parseDate(startDateStr) && (
                <Text style={styles.datePreview}>
                  {formatDateDisplay(startDateStr)}
                </Text>
              )}
            </View>

            <View style={styles.dateField}>
              <TextInput
                label="End Date *"
                value={endDateStr}
                onChangeText={(text) => handleDateChange(text, false)}
                mode="outlined"
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
                error={!!errors.endDate}
                left={<TextInput.Icon icon="calendar" />}
              />
              {endDateStr && parseDate(endDateStr) && (
                <Text style={styles.datePreview}>
                  {formatDateDisplay(endDateStr)}
                </Text>
              )}
            </View>
          </View>
          {errors.startDate && (
            <HelperText type="error" visible={!!errors.startDate}>
              {errors.startDate}
            </HelperText>
          )}
          {errors.endDate && (
            <HelperText type="error" visible={!!errors.endDate}>
              {errors.endDate}
            </HelperText>
          )}
        </View>

        <TextInput
          label="Website URL"
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., https://biotech-summit.com"
          keyboardType="url"
          autoCapitalize="none"
          error={!!errors.websiteUrl}
          left={<TextInput.Icon icon="web" />}
        />
        {errors.websiteUrl && (
          <HelperText type="error" visible={!!errors.websiteUrl}>
            {errors.websiteUrl}
          </HelperText>
        )}

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          placeholder="Brief description of the conference..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isEditing ? 'Save Changes' : 'Create Conference'}
          </Button>
        </View>
      </Surface>

      <Surface style={styles.tips}>
        <View style={styles.tipHeader}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#F59E0B" />
          <Text variant="titleSmall" style={styles.tipTitle}>Tips</Text>
        </View>
        <Text style={styles.tipText}>
          {'\u2022'} Enter dates in YYYY-MM-DD format (e.g., 2026-03-15)
        </Text>
        <Text style={styles.tipText}>
          {'\u2022'} Set dates accurately to help track which conference contacts are from
        </Text>
        <Text style={styles.tipText}>
          {'\u2022'} Include the location to help with travel planning and context
        </Text>
        <Text style={styles.tipText}>
          {'\u2022'} Add the website URL for quick reference to the conference program
        </Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  form: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 20,
    color: '#0D9488',
  },
  input: {
    marginBottom: 12,
  },
  dateSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#94A3B8',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    marginBottom: 4,
  },
  datePreview: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  tips: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#1E293B',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipTitle: {
    color: '#F59E0B',
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});
