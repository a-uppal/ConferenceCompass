import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text, Surface, Button, Chip, Divider, TextInput, Card, IconButton, FAB } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import { useSessionStore } from '@/stores/sessionStore';
import { supabase } from '@/services/supabase';
import { Session, TalkingPoint, SessionCapture } from '@/types/database';
import { isSessionLive, parseTimestamp } from '@/utils/dateUtils';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { sessions, updateAttendance, addCapture, loadSessionDetails } = useSessionStore();

  const [session, setSession] = useState<Session & {
    talking_points?: TalkingPoint[];
    captures?: SessionCapture[];
  } | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'planned' | 'attending' | 'attended' | 'skipped'>('planned');
  const [takeaways, setTakeaways] = useState('');
  const [isEditingTakeaways, setIsEditingTakeaways] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    if (!id) return;

    // First check local state
    const localSession = sessions.find((s) => s.id === id);
    if (localSession) {
      setSession(localSession);
      setAttendanceStatus(localSession.attendance?.status || 'planned');
      setTakeaways(localSession.attendance?.key_takeaways || '');
    }

    // Then load full details from server
    const details = await loadSessionDetails(id);
    if (details) {
      setSession(details);
      if (details.attendance) {
        setAttendanceStatus(details.attendance.status);
        setTakeaways(details.attendance.key_takeaways || '');
      }
    }
  };

  const handleAttendanceChange = async (status: typeof attendanceStatus) => {
    if (!user || !session) return;

    try {
      setAttendanceStatus(status);
      await updateAttendance(session.id, user.id, status, takeaways);
    } catch (err) {
      console.error('Error updating attendance:', err);
      Alert.alert('Error', 'Failed to update attendance status');
    }
  };

  const handleSaveTakeaways = async () => {
    if (!user || !session) return;

    try {
      await updateAttendance(session.id, user.id, attendanceStatus, takeaways);
      setIsEditingTakeaways(false);
    } catch (err) {
      console.error('Error saving takeaways:', err);
      Alert.alert('Error', 'Failed to save takeaways');
    }
  };

  const handleTakePhoto = async () => {
    setFabOpen(false);
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos');
      return;
    }

    // Navigate to camera screen with session context
    router.push({
      pathname: '/session/capture-photo',
      params: { sessionId: id },
    });
  };

  const handleStartRecording = async () => {
    setFabOpen(false);

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recording || !user || !session) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Upload to Supabase Storage
        const filename = `voice-notes/${user.id}/${session.id}/${Date.now()}.m4a`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('session-captures')
          .upload(filename, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('session-captures')
          .getPublicUrl(filename);

        // Save capture record
        await addCapture({
          session_id: session.id,
          user_id: user.id,
          capture_type: 'voice_note',
          content_url: urlData.publicUrl,
        });

        Alert.alert('Success', 'Voice note saved');
        loadSession();
      }
    } catch (err) {
      console.error('Failed to save recording:', err);
      Alert.alert('Error', 'Failed to save voice note');
    }
  };

  const handleAddTextNote = () => {
    setFabOpen(false);
    Alert.prompt(
      'Add Note',
      'Enter your note for this session:',
      async (text) => {
        if (text && user && session) {
          try {
            await addCapture({
              session_id: session.id,
              user_id: user.id,
              capture_type: 'text_note',
              text_content: text,
            });
            loadSession();
          } catch (err) {
            console.error('Error adding note:', err);
          }
        }
      },
      'plain-text'
    );
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Loading session...</Text>
      </View>
    );
  }

  const startTime = parseTimestamp(session.start_time);
  const endTime = parseTimestamp(session.end_time);
  const isNow = isSessionLive(session.start_time, session.end_time);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Session Header */}
        <Surface style={styles.header}>
          {isNow && (
            <Chip style={styles.liveChip} textStyle={styles.liveChipText}>
              🔴 LIVE NOW
            </Chip>
          )}
          <Text variant="headlineSmall" style={styles.title}>
            {session.title}
          </Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" />
            <Text style={styles.metaText}>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {session.location && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94A3B8" />
              <Text style={styles.metaText}>{session.location}</Text>
            </View>
          )}

          {session.speaker_name && (
            <View style={styles.speakerSection}>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {session.speaker_name}
                  {session.speaker_company && ` • ${session.speaker_company}`}
                </Text>
              </View>
              {session.speaker_role && (
                <Text style={styles.speakerRole}>{session.speaker_role}</Text>
              )}
            </View>
          )}

          {session.track && (
            <Chip style={styles.trackChip}>{session.track}</Chip>
          )}
        </Surface>

        {/* Attendance Status */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Your Status
          </Text>
          <View style={styles.attendanceRow}>
            <Chip
              selected={attendanceStatus === 'planned'}
              onPress={() => handleAttendanceChange('planned')}
              style={styles.attendanceChip}
            >
              📋 Planned
            </Chip>
            <Chip
              selected={attendanceStatus === 'attending'}
              onPress={() => handleAttendanceChange('attending')}
              style={styles.attendanceChip}
            >
              👋 Attending
            </Chip>
            <Chip
              selected={attendanceStatus === 'attended'}
              onPress={() => handleAttendanceChange('attended')}
              style={styles.attendanceChip}
            >
              ✅ Attended
            </Chip>
            <Chip
              selected={attendanceStatus === 'skipped'}
              onPress={() => handleAttendanceChange('skipped')}
              style={styles.attendanceChip}
            >
              ⏭️ Skipped
            </Chip>
          </View>
        </Surface>

        {/* Relevance to Compass */}
        {session.relevance && (
          <Surface style={[styles.section, styles.relevanceSection]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🎯 Why This Speaker Matters
            </Text>
            <Divider style={styles.divider} />
            <Text style={styles.relevanceText}>{session.relevance}</Text>
          </Surface>
        )}

        {/* Talking Points */}
        {session.talking_points && session.talking_points.length > 0 && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              💡 Talking Points
            </Text>
            <Divider style={styles.divider} />
            {session.talking_points
              .sort((a, b) => a.priority - b.priority)
              .map((tp, index) => (
                <View key={tp.id} style={styles.talkingPoint}>
                  <Text style={styles.tpNumber}>{index + 1}</Text>
                  <View style={styles.tpContent}>
                    <Text style={styles.tpText}>{tp.content}</Text>
                    {tp.category && (
                      <Chip compact style={styles.tpCategory}>
                        {tp.category}
                      </Chip>
                    )}
                  </View>
                </View>
              ))}
          </Surface>
        )}

        {/* Demo Focus */}
        {session.demo_focus && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🖥️ Demo Focus
            </Text>
            <Divider style={styles.divider} />
            <Text style={styles.demoFocusText}>{session.demo_focus}</Text>
          </Surface>
        )}

        {/* Partnership Opportunity */}
        {session.partnership_opportunity && (
          <Surface style={[styles.section, styles.partnershipSection]}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🤝 Partnership Opportunity
            </Text>
            <Divider style={styles.divider} />
            <Text style={styles.partnershipText}>{session.partnership_opportunity}</Text>
          </Surface>
        )}

        {/* Description */}
        {session.description && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About This Session
            </Text>
            <Divider style={styles.divider} />
            <Text style={styles.description}>{session.description}</Text>
          </Surface>
        )}

        {/* Key Takeaways */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📝 Your Key Takeaways
            </Text>
            {!isEditingTakeaways && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setIsEditingTakeaways(true)}
              />
            )}
          </View>
          <Divider style={styles.divider} />

          {isEditingTakeaways ? (
            <View>
              <TextInput
                value={takeaways}
                onChangeText={setTakeaways}
                multiline
                numberOfLines={4}
                mode="outlined"
                placeholder="What were your key takeaways from this session?"
              />
              <View style={styles.takeawayActions}>
                <Button onPress={() => setIsEditingTakeaways(false)}>Cancel</Button>
                <Button mode="contained" onPress={handleSaveTakeaways}>
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <Text style={styles.takeawaysText}>
              {takeaways || 'No takeaways captured yet. Tap the pencil to add.'}
            </Text>
          )}
        </Surface>

        {/* Slide Photos */}
        {session.captures && session.captures.filter(c => c.capture_type === 'photo').length > 0 && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📷 Slide Photos
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.photoGrid}>
              {session.captures
                .filter(c => c.capture_type === 'photo' && c.content_url)
                .map((capture) => (
                  <TouchableOpacity
                    key={capture.id}
                    style={styles.photoThumbnail}
                    onPress={() => setSelectedPhoto(capture.content_url!)}
                  >
                    <Image
                      source={{ uri: capture.content_url }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoTime}>
                      {new Date(capture.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </Surface>
        )}

        {/* Other Captures (Voice Notes & Text Notes) */}
        {session.captures && session.captures.filter(c => c.capture_type !== 'photo').length > 0 && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📎 Notes & Recordings
            </Text>
            <Divider style={styles.divider} />
            {session.captures
              .filter(c => c.capture_type !== 'photo')
              .map((capture) => (
                <Card key={capture.id} style={styles.captureCard}>
                  <Card.Title
                    title={
                      capture.capture_type === 'voice_note'
                        ? '🎙️ Voice Note'
                        : '📝 Note'
                    }
                    subtitle={new Date(capture.created_at).toLocaleString()}
                  />
                  {capture.text_content && (
                    <Card.Content>
                      <Text>{capture.text_content}</Text>
                    </Card.Content>
                  )}
                </Card>
              ))}
          </Surface>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#F8FAFC" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Recording Indicator */}
      {isRecording && (
        <Surface style={styles.recordingIndicator}>
          <MaterialCommunityIcons name="microphone" size={24} color="#EF4444" />
          <Text style={styles.recordingText}>Recording...</Text>
          <Button mode="contained" onPress={handleStopRecording}>
            Stop
          </Button>
        </Surface>
      )}

      {/* FAB for captures */}
      {!isRecording && (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'camera',
              label: 'Take Photo',
              onPress: handleTakePhoto,
            },
            {
              icon: 'microphone',
              label: 'Voice Note',
              onPress: handleStartRecording,
            },
            {
              icon: 'note-plus',
              label: 'Add Note',
              onPress: handleAddTextNote,
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={styles.fab}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    marginBottom: 12,
  },
  liveChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    color: '#94A3B8',
  },
  trackChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#1E293B',
  },
  speakerSection: {
    marginTop: 4,
  },
  speakerRole: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 24,
    marginTop: 2,
    fontStyle: 'italic',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  relevanceSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
  },
  relevanceText: {
    lineHeight: 22,
    color: '#F8FAFC',
  },
  demoFocusText: {
    lineHeight: 22,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  partnershipSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#1E293B',
  },
  partnershipText: {
    lineHeight: 22,
    color: '#FCD34D',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0D9488',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attendanceChip: {
    backgroundColor: '#1E293B',
  },
  talkingPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  tpNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
  },
  tpContent: {
    flex: 1,
  },
  tpText: {
    lineHeight: 22,
  },
  tpCategory: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#1E293B',
  },
  description: {
    lineHeight: 22,
    opacity: 0.8,
  },
  takeawaysText: {
    lineHeight: 22,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  takeawayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  captureCard: {
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnail: {
    width: (Dimensions.get('window').width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoTime: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 10,
    color: '#F8FAFC',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingText: {
    flex: 1,
    color: '#EF4444',
    fontWeight: '600',
  },
  fab: {
    backgroundColor: '#0D9488',
  },
  bottomPadding: {
    height: 80,
  },
});
