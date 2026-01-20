import { useState, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { scanBadge, uploadBadgePhoto, BadgeScanResult } from '@/services/badgeOCR';

export default function CaptureScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
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
          setCapturedBase64(photo.base64 || null);
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
      setCapturedBase64(result.assets[0].base64 || null);
    }
  };

  const toggleFlash = () => {
    setFlashMode((current) =>
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  const processAndNavigate = async () => {
    if (!capturedImage || !user) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Uploading badge photo...');

    try {
      // Step 1: Upload the badge photo
      const badgeUrl = await uploadBadgePhoto(capturedImage, user.id);

      setProcessingStatus('Analyzing badge with AI...');

      // Step 2: Process with OCR (use base64 for better quality)
      let scanResult: BadgeScanResult;
      try {
        scanResult = await scanBadge(capturedBase64, badgeUrl);
      } catch (ocrError: any) {
        console.warn('OCR failed, proceeding with empty result:', ocrError);
        // Create an empty result so user can still enter data manually
        scanResult = {
          success: false,
          extracted: {},
          ocr_data: null,
          ocr_confidence_score: 0,
          ocr_available: false,
          processingTimeMs: 0,
          error: ocrError.message,
        };
      }

      // Step 3: Navigate to review screen with results
      router.push({
        pathname: '/contact/review-badge',
        params: {
          imageUri: capturedImage,
          badgeUrl: badgeUrl || '',
          scanResult: JSON.stringify(scanResult),
        },
      });
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process badge. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBase64(null);
    setError(null);
  };

  const handleManualEntry = () => {
    router.push('/contact/new');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0D9488" />
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
          <Button mode="text" onPress={handleManualEntry} style={styles.altButton}>
            Enter Manually Instead
          </Button>
        </Surface>
      </View>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />

        {isProcessing ? (
          <Surface style={styles.processingCard}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text variant="bodyMedium" style={styles.processingText}>
              {processingStatus}
            </Text>
            <Text variant="bodySmall" style={styles.processingSubtext}>
              This may take a few seconds...
            </Text>
          </Surface>
        ) : (
          <Surface style={styles.resultCard}>
            {error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
            )}

            <Text variant="titleMedium" style={styles.previewTitle}>
              Badge Captured
            </Text>
            <Text variant="bodyMedium" style={styles.previewSubtitle}>
              Tap "Process Badge" to extract contact information using AI
            </Text>

            <View style={styles.resultActions}>
              <Button mode="outlined" onPress={handleRetake} style={styles.actionButton}>
                Retake
              </Button>
              <Button
                mode="contained"
                onPress={processAndNavigate}
                style={styles.actionButton}
                icon="text-recognition"
              >
                Process Badge
              </Button>
            </View>

            <Button
              mode="text"
              onPress={handleManualEntry}
              style={styles.manualButton}
            >
              Skip OCR - Enter Manually
            </Button>
          </Surface>
        )}
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.back}
        flashMode={flashMode}
      >
        <View style={styles.overlay}>
          {/* Flash toggle button */}
          <View style={styles.flashContainer}>
            <IconButton
              icon={flashMode === FlashMode.on ? 'flash' : 'flash-off'}
              iconColor="#fff"
              size={24}
              onPress={toggleFlash}
              style={styles.flashButton}
            />
          </View>

          {/* Badge alignment frame */}
          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              {/* Corner brackets for visual guide */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
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
          labelStyle={styles.controlLabel}
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
          labelStyle={styles.controlLabel}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flashContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  flashButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '85%',
    height: 200,
    borderWidth: 0,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#0D9488',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  frameText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
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
    borderColor: '#334155',
  },
  controlLabel: {
    color: '#F8FAFC',
  },
  captureButton: {
    backgroundColor: '#0D9488',
  },
  captureButtonContent: {
    paddingHorizontal: 32,
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
    backgroundColor: '#1E293B',
  },
  processingText: {
    marginTop: 16,
    color: '#F8FAFC',
  },
  processingSubtext: {
    marginTop: 4,
    color: '#94A3B8',
  },
  resultCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  errorText: {
    color: '#F59E0B',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewTitle: {
    color: '#0D9488',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSubtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  manualButton: {
    marginTop: 12,
  },
  permissionCard: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  permissionTitle: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#F8FAFC',
  },
  permissionText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#94A3B8',
  },
  altButton: {
    marginTop: 12,
  },
});
