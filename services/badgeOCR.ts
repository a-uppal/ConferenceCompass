// Badge OCR Service - Client-side service for badge scanning
import { supabase } from './supabase';
import { ConfidenceLevel, OCRExtractionData } from '@/types/database';

export interface BadgeScanResult {
  success: boolean;
  extracted: {
    first_name?: string;
    last_name?: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  ocr_data: OCRExtractionData | null;
  ocr_confidence_score: number;
  ocr_available: boolean;
  processingTimeMs: number;
  error?: string;
  message?: string;
}

/**
 * Scan a badge photo and extract contact information using Claude Vision OCR
 * @param imageBase64 - Base64 encoded image data (without data:image prefix)
 * @param imageUrl - Optional public URL to the image (used if base64 not provided)
 * @returns Extracted contact data with confidence scores
 */
export async function scanBadge(
  imageBase64?: string | null,
  imageUrl?: string | null
): Promise<BadgeScanResult> {
  if (!imageBase64 && !imageUrl) {
    throw new Error('Either imageBase64 or imageUrl is required');
  }

  const { data, error } = await supabase.functions.invoke<BadgeScanResult>(
    'process-badge-photo',
    {
      body: {
        image_base64: imageBase64,
        image_url: imageUrl,
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Failed to process badge image');
  }

  return data || {
    success: false,
    extracted: {},
    ocr_data: null,
    ocr_confidence_score: 0,
    ocr_available: false,
    processingTimeMs: 0,
    error: 'No response from OCR service',
  };
}

/**
 * Upload a badge photo to Supabase Storage and return the public URL
 * @param imageUri - Local file URI of the captured image
 * @param userId - User ID for path organization
 * @returns Public URL of the uploaded image
 */
export async function uploadBadgePhoto(
  imageUri: string,
  userId: string
): Promise<string | null> {
  try {
    const filename = `badges/${userId}/${Date.now()}.jpg`;
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('contact-badges')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Badge upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('contact-badges')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Badge upload error:', err);
    return null;
  }
}

/**
 * Generate a LinkedIn search URL for a contact
 * @param firstName - Contact's first name
 * @param lastName - Contact's last name
 * @param company - Optional company name to narrow search
 * @returns LinkedIn people search URL
 */
export function generateLinkedInSearchUrl(
  firstName: string,
  lastName: string,
  company?: string
): string {
  const query = company
    ? `${firstName} ${lastName} ${company}`
    : `${firstName} ${lastName}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

/**
 * Get display color for confidence level
 * @param confidence - OCR confidence level
 * @returns Color code for UI display
 */
export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return '#10B981'; // Green
    case 'medium':
      return '#F59E0B'; // Amber
    case 'low':
      return '#EF4444'; // Red
    case 'not_found':
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get display icon for confidence level
 * @param confidence - OCR confidence level
 * @returns Icon name for display
 */
export function getConfidenceIcon(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'check-circle';
    case 'medium':
      return 'alert-circle';
    case 'low':
      return 'alert';
    case 'not_found':
    default:
      return 'close-circle';
  }
}

/**
 * Get human-readable label for confidence level
 * @param confidence - OCR confidence level
 * @returns Display label
 */
export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    case 'not_found':
    default:
      return 'Not found';
  }
}
