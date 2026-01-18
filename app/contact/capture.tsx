import { useState, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';

interface ExtractedContact {
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
}

export default function CaptureScreen() {
  const { user } = useAuth();
  const { activeConference } = useTeam();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo) {
          setCapturedImage(photo.uri);
          await processImage(photo.uri, photo.base64);
        }
      } catch (err) {
        setError('Failed to take picture');
        console.error(err);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      await processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processImage = async (uri: string, base64?: string | null) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call OCR Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('process-badge-photo', {
        body: {
          image_base64: base64,
          image_uri: uri,
        },
      });

      if (fnError) throw fnError;

      if (data?.extracted) {
        setExtractedData(data.extracted);
      } else {
        // If no OCR available, show manual entry option
        setExtractedData({});
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      // Gracefully handle - allow manual entry
      setExtractedData({});
      setError('Could not auto-extract text. You can enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadBadgePhoto = async (uri: string): Promise<string | null> => {
    try {
      const filename = `badges/${user?.id}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('contact-badges')
        .upload(filename, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contact-badges')
        .getPublicUrl(filename);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage || !extractedData) return;

    // Upload badge photo
    const badgeUrl = await uploadBadgePhoto(capturedImage);

    // Navigate to new contact form with pre-filled data
    router.replace({
      pathname: '/contact/new',
      params: {
        prefill: JSON.stringify({
          ...extractedData,
          badge_photo_url: badgeUrl,
        }),
      },
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setError(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Surface style={styles.permissionCard}>
          <Text variant="headlineSmall" style={styles.permissionTitle}>
            Camera Access Required
          </Text>
          <Text variant="bodyMedium" style={styles.permissionText}>
            Conference Compass needs camera access to capture badge photos for quick contact entry.
          </Text>
          <Button mode="contained" onPress={requestPermission}>
            Grant Permission
          </Button>
          <Button mode="outlined" onPress={pickImage} style={styles.altButton}>
            Choose from Library
          </Button>
        </Surface>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />

        {isProcessing ? (
          <Surface style={styles.processingCard}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text variant="bodyMedium" style={styles.processingText}>
              Extracting contact information...
            </Text>
          </Surface>
        ) : (
          <Surface style={styles.resultCard}>
            {error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
            )}

            {extractedData && (
              <View style={styles.extractedInfo}>
                <Text variant="titleMedium" style={styles.extractedTitle}>
                  Extracted Information
                </Text>
                {extractedData.first_name && (
                  <Text>Name: {extractedData.first_name} {extractedData.last_name}</Text>
                )}
                {extractedData.company && <Text>Company: {extractedData.company}</Text>}
                {extractedData.title && <Text>Title: {extractedData.title}</Text>}
                {extractedData.email && <Text>Email: {extractedData.email}</Text>}
                {extractedData.phone && <Text>Phone: {extractedData.phone}</Text>}
                {!extractedData.first_name && !extractedData.company && (
                  <Text style={styles.noDataText}>
                    No text extracted. You can enter details manually.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.resultActions}>
              <Button mode="outlined" onPress={handleRetake}>
                Retake
              </Button>
              <Button mode="contained" onPress={handleConfirm}>
                Continue
              </Button>
            </View>
          </Surface>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.back}
      >
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <Text style={styles.frameText}>
              Position badge within frame
            </Text>
          </View>
        </View>
      </Camera>

      <View style={styles.controls}>
        <Button
          mode="outlined"
          onPress={pickImage}
          style={styles.controlButton}
        >
          Gallery
        </Button>
        <Button
          mode="contained"
          onPress={takePicture}
          style={styles.captureButton}
          contentStyle={styles.captureButtonContent}
        >
          Capture
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.controlButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  frame: {
    width: '85%',
    height: 200,
    borderWidth: 2,
    borderColor: '#0D9488',
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  frameText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F172A',
  },
  controlButton: {
    minWidth: 80,
  },
  captureButton: {
    backgroundColor: '#0D9488',
  },
  captureButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  processingCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
  },
  resultCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 12,
  },
  errorText: {
    color: '#F59E0B',
    marginBottom: 12,
  },
  extractedInfo: {
    marginBottom: 16,
  },
  extractedTitle: {
    marginBottom: 8,
    color: '#0D9488',
  },
  noDataText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  permissionCard: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  altButton: {
    marginTop: 12,
  },
});
