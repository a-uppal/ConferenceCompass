import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useContactStore } from '@/stores/contactStore';
import {
  getConfidenceColor,
  getConfidenceIcon,
  generateLinkedInSearchUrl,
  BadgeScanResult,
} from '@/services/badgeOCR';
import { ConfidenceLevel, OCRExtractionData } from '@/types/database';

interface FieldWithConfidence {
  value: string;
  confidence: ConfidenceLevel;
}

function ConfidenceIndicator({ confidence }: { confidence: ConfidenceLevel }) {
  const color = getConfidenceColor(confidence);
  const iconName = getConfidenceIcon(confidence);

  return (
    <MaterialCommunityIcons
      name={iconName as any}
      size={20}
      color={color}
      style={styles.confidenceIcon}
    />
  );
}

function EditableFieldWithConfidence({
  label,
  value,
  confidence,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.fieldContainer}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        mode="outlined"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        right={
          <TextInput.Icon
            icon={() => <ConfidenceIndicator confidence={confidence} />}
          />
        }
      />
    </View>
  );
}

export default function ReviewBadgeScreen() {
  const { user } = useAuth();
  const { activeConference } = useTeam();
  const { addContact, isLoading } = useContactStore();
  const params = useLocalSearchParams<{
    imageUri?: string;
    badgeUrl?: string;
    scanResult?: string;
  }>();

  // Parse the scan result from params
  const scanResult: BadgeScanResult | null = params.scanResult
    ? JSON.parse(params.scanResult)
    : null;

  const ocrData = scanResult?.ocr_data;

  // Initialize fields with extracted data
  const [firstName, setFirstName] = useState<FieldWithConfidence>({
    value: ocrData?.firstName?.value || '',
    confidence: ocrData?.firstName?.confidence || 'not_found',
  });
  const [lastName, setLastName] = useState<FieldWithConfidence>({
    value: ocrData?.lastName?.value || '',
    confidence: ocrData?.lastName?.confidence || 'not_found',
  });
  const [company, setCompany] = useState<FieldWithConfidence>({
    value: ocrData?.company?.value || '',
    confidence: ocrData?.company?.confidence || 'not_found',
  });
  const [title, setTitle] = useState<FieldWithConfidence>({
    value: ocrData?.title?.value || '',
    confidence: ocrData?.title?.confidence || 'not_found',
  });
  const [email, setEmail] = useState<FieldWithConfidence>({
    value: ocrData?.email?.value || '',
    confidence: ocrData?.email?.confidence || 'not_found',
  });
  const [phone, setPhone] = useState<FieldWithConfidence>({
    value: ocrData?.phone?.value || '',
    confidence: ocrData?.phone?.confidence || 'not_found',
  });

  const [notes, setNotes] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [error, setError] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);

  const imageUri = params.imageUri;
  const badgePhotoUrl = params.badgeUrl;
  const confidenceScore = scanResult?.ocr_confidence_score || 0;

  const handleLinkedInSearch = () => {
    if (firstName.value || lastName.value) {
      const searchUrl = generateLinkedInSearchUrl(
        firstName.value,
        lastName.value,
        company.value || undefined
      );
      Linking.openURL(searchUrl);
    }
  };

  const handleSave = async () => {
    try {
      setError('');

      if (!firstName.value.trim() || !lastName.value.trim()) {
        setError('First name and last name are required');
        return;
      }

      if (!activeConference || !user) {
        setError('No active conference selected');
        return;
      }

      // Build OCR extraction data for storage
      const ocrExtractionData: OCRExtractionData = {
        firstName: { value: firstName.value || null, confidence: firstName.confidence },
        lastName: { value: lastName.value || null, confidence: lastName.confidence },
        company: { value: company.value || null, confidence: company.confidence },
        title: { value: title.value || null, confidence: title.confidence },
        email: { value: email.value || null, confidence: email.confidence },
        phone: { value: phone.value || null, confidence: phone.confidence },
        rawText: ocrData?.rawText || '',
      };

      await addContact({
        conference_id: activeConference.id,
        captured_by: user.id,
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        company: company.value.trim() || undefined,
        title: title.value.trim() || undefined,
        email: email.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        badge_photo_url: badgePhotoUrl || undefined,
        notes: notes.trim() || undefined,
        follow_up_status: 'none',
        ocr_extraction_data: ocrExtractionData,
        ocr_confidence_score: confidenceScore,
        capture_method: 'badge_scan',
      });

      // Navigate back to contacts list
      router.replace('/(tabs)/contacts');
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    }
  };

  const handleScanAnother = async () => {
    // Save current contact first
    await handleSave();
    // Then go back to capture screen
    router.push('/contact/capture');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Badge Photo Thumbnail */}
        {imageUri && (
          <TouchableOpacity
            onPress={() => setShowFullImage(!showFullImage)}
            activeOpacity={0.8}
          >
            <Surface style={styles.imageCard}>
              <Image
                source={{ uri: imageUri }}
                style={showFullImage ? styles.fullImage : styles.thumbnailImage}
                resizeMode="contain"
              />
              <Text variant="labelSmall" style={styles.imageTip}>
                Tap to {showFullImage ? 'shrink' : 'expand'}
              </Text>
            </Surface>
          </TouchableOpacity>
        )}

        {/* OCR Confidence Summary */}
        {scanResult?.ocr_available && (
          <Surface style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <MaterialCommunityIcons
                name="text-recognition"
                size={20}
                color="#0D9488"
              />
              <Text variant="labelMedium" style={styles.confidenceTitle}>
                OCR Confidence: {Math.round(confidenceScore * 100)}%
              </Text>
            </View>
            {confidenceScore < 0.5 && (
              <Text variant="bodySmall" style={styles.confidenceWarning}>
                Low confidence - please verify extracted data
              </Text>
            )}
          </Surface>
        )}

        {/* Main Form */}
        <Surface style={styles.form}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contact Information
          </Text>

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <View style={styles.row}>
            <View style={styles.halfField}>
              <EditableFieldWithConfidence
                label="First Name *"
                value={firstName.value}
                confidence={firstName.confidence}
                onChangeText={(text) =>
                  setFirstName({ ...firstName, value: text })
                }
              />
            </View>
            <View style={styles.halfField}>
              <EditableFieldWithConfidence
                label="Last Name *"
                value={lastName.value}
                confidence={lastName.confidence}
                onChangeText={(text) =>
                  setLastName({ ...lastName, value: text })
                }
              />
            </View>
          </View>

          <EditableFieldWithConfidence
            label="Company"
            value={company.value}
            confidence={company.confidence}
            onChangeText={(text) => setCompany({ ...company, value: text })}
          />

          <EditableFieldWithConfidence
            label="Job Title"
            value={title.value}
            confidence={title.confidence}
            onChangeText={(text) => setTitle({ ...title, value: text })}
          />

          <EditableFieldWithConfidence
            label="Email"
            value={email.value}
            confidence={email.confidence}
            onChangeText={(text) => setEmail({ ...email, value: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <EditableFieldWithConfidence
            label="Phone"
            value={phone.value}
            confidence={phone.confidence}
            onChangeText={(text) => setPhone({ ...phone, value: text })}
            keyboardType="phone-pad"
          />

          {/* LinkedIn Search Button */}
          <Button
            mode="outlined"
            onPress={handleLinkedInSearch}
            icon="linkedin"
            style={styles.linkedinButton}
            disabled={!firstName.value && !lastName.value}
          >
            Find on LinkedIn
          </Button>

          <TextInput
            label="LinkedIn Profile URL"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            placeholder="https://linkedin.com/in/username"
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Quick Note (optional)
          </Text>
          <TextInput
            label="Notes about this contact"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
            placeholder="Met at AI session, interested in data platform..."
          />
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Save Contact
          </Button>
        </View>

        {/* Scan Another Button */}
        <Button
          mode="text"
          onPress={handleScanAnother}
          icon="camera"
          style={styles.scanAnotherButton}
          disabled={isLoading || !firstName.value || !lastName.value}
        >
          Save & Scan Another
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    padding: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  fullImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  imageTip: {
    marginTop: 8,
    color: '#94A3B8',
  },
  confidenceCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceTitle: {
    color: '#F8FAFC',
  },
  confidenceWarning: {
    color: '#F59E0B',
    marginTop: 4,
  },
  form: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0D9488',
    marginBottom: 16,
  },
  error: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  confidenceIcon: {
    marginRight: 4,
  },
  linkedinButton: {
    marginBottom: 12,
    borderColor: '#0077B5',
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: '#F8FAFC',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  scanAnotherButton: {
    marginTop: 16,
  },
});
