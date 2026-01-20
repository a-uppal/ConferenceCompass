import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Button, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import { useSessionStore } from '@/stores/sessionStore';
import { supabase } from '@/services/supabase';

export default function CapturePhotoScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { addCapture, sessions } = useSessionStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<Camera>(null);

  const session = sessions.find(s => s.id === sessionId);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#94A3B8" />
        <Text style={styles.permissionText}>
          Camera access is needed to capture slides
        </Text>
        <Button mode="contained" onPress={() => Camera.requestCameraPermissionsAsync()} style={styles.permissionButton}>
          Grant Permission
        </Button>
        <Button onPress={() => router.back()} style={styles.cancelButton}>
          Cancel
        </Button>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleSave = async () => {
    if (!capturedPhoto || !user || !sessionId) return;

    setIsUploading(true);

    try {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(capturedPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate filename
      const filename = `slides/${user.id}/${sessionId}/${Date.now()}.jpg`;

      // Upload to Supabase Storage using base64
      console.log('Attempting storage upload to:', filename);
      const { error: uploadError } = await supabase.storage
        .from('session-captures')
        .upload(filename, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('STORAGE upload error:', JSON.stringify(uploadError, null, 2));
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      console.log('Storage upload SUCCESS');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('session-captures')
        .getPublicUrl(filename);

      // Save capture record - direct insert to debug
      console.log('Saving capture with:', { sessionId, userId: user.id, url: urlData.publicUrl });

      // Get current auth user to verify
      const { data: authData } = await supabase.auth.getUser();
      console.log('Auth user ID:', authData?.user?.id);

      // Direct insert bypassing store - no select
      console.log('Attempting DATABASE insert...');
      const { error: insertError } = await supabase
        .from('session_captures')
        .insert({
          session_id: sessionId,
          user_id: authData?.user?.id || user.id,
          capture_type: 'photo',
          content_url: urlData.publicUrl,
        });

      if (insertError) {
        console.error('DATABASE insert error:', JSON.stringify(insertError, null, 2));
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log('DATABASE insert SUCCESS!');

      Alert.alert('Success', 'Slide photo saved!', [
        { text: 'Take Another', onPress: () => setCapturedPhoto(null) },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error saving photo:', JSON.stringify(error, null, 2));
      const details = error?.details || error?.hint || error?.code || '';
      Alert.alert('Error', `Failed to save photo: ${error.message || 'Unknown error'}\n\n${details}`);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  // Preview mode - show captured photo
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="close"
            iconColor="#F8FAFC"
            size={24}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>
            {session?.title ? `📷 ${session.title.substring(0, 25)}...` : 'Capture Slide'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <Image source={{ uri: capturedPhoto }} style={styles.preview} resizeMode="contain" />

        <Surface style={styles.previewActions}>
          <Button
            mode="outlined"
            onPress={handleRetake}
            disabled={isUploading}
            style={styles.actionButton}
          >
            Retake
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isUploading}
            disabled={isUploading}
            style={styles.actionButton}
          >
            Save Slide
          </Button>
        </Surface>
      </View>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor="#F8FAFC"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>
          {session?.title ? `📷 ${session.title.substring(0, 25)}...` : 'Capture Slide'}
        </Text>
        <IconButton
          icon="camera-flip"
          iconColor="#F8FAFC"
          size={24}
          onPress={toggleCameraFacing}
        />
      </View>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
      >
        {/* Guide overlay for slide capture */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideCorner} />
          <View style={[styles.guideCorner, styles.guideTopRight]} />
          <View style={[styles.guideCorner, styles.guideBottomLeft]} />
          <View style={[styles.guideCorner, styles.guideBottomRight]} />
        </View>
      </Camera>

      <View style={styles.controls}>
        <Text style={styles.hint}>Position the slide within the frame</Text>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper function to decode base64 for React Native
function decode(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') bufferLength--;
  if (base64[base64.length - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 8,
    backgroundColor: '#0F172A',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
  camera: {
    flex: 1,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCorner: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 40,
    height: 40,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#0D9488',
  },
  guideTopRight: {
    left: undefined,
    right: '10%',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  guideBottomLeft: {
    top: undefined,
    bottom: '15%',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  guideBottomRight: {
    top: undefined,
    left: undefined,
    right: '10%',
    bottom: '15%',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  controls: {
    backgroundColor: '#0F172A',
    padding: 24,
    alignItems: 'center',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0D9488',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
  },
  preview: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#1E293B',
  },
  actionButton: {
    flex: 1,
  },
});
