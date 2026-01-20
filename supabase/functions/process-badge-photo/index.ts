// Supabase Edge Function for processing badge photos with Claude Vision OCR
// Deploy with: supabase functions deploy process-badge-photo
// Required secret: ANTHROPIC_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

interface OCRFieldResult {
  value: string | null;
  confidence: ConfidenceLevel;
}

interface BadgeExtractionResult {
  firstName: OCRFieldResult;
  lastName: OCRFieldResult;
  company: OCRFieldResult;
  title: OCRFieldResult;
  email: OCRFieldResult;
  phone: OCRFieldResult;
  rawText: string;
}

interface ExtractedContact {
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
}

const BADGE_EXTRACTION_PROMPT = `You are analyzing a conference badge photo to extract contact information.

Analyze the image and extract the following fields. For each field, provide the extracted value and a confidence level (high, medium, low, or not_found).

Fields to extract:
1. First Name
2. Last Name
3. Company/Organization
4. Job Title/Role
5. Email Address
6. Phone Number

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "firstName": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "lastName": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "company": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "title": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "email": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "phone": { "value": "string or null", "confidence": "high|medium|low|not_found" },
  "rawText": "all visible text on the badge"
}

Confidence guidelines:
- high: Text is clearly visible and unambiguous
- medium: Text is partially visible or could have multiple interpretations
- low: Text is blurry, partially obscured, or uncertain
- not_found: Field not present on badge or not visible

Common badge formats to handle:
- Name prominently displayed (usually largest text)
- Company often below or above name
- Title may be smaller text near name
- Email/phone sometimes on badges, often not
- QR codes may be present (ignore, not contact info)
- Conference name/logo (ignore, not contact info)
- Lanyard or holder may partially obscure text

Important: If the image is too blurry, not a badge, or unreadable, still return valid JSON with all fields as not_found and rawText describing the issue.`;

function calculateOverallConfidence(result: BadgeExtractionResult): number {
  const weights = {
    firstName: 0.25,
    lastName: 0.25,
    company: 0.2,
    title: 0.1,
    email: 0.15,
    phone: 0.05,
  };

  const confidenceScores = {
    high: 1.0,
    medium: 0.7,
    low: 0.3,
    not_found: 0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [field, weight] of Object.entries(weights)) {
    const fieldResult = result[field as keyof Omit<BadgeExtractionResult, 'rawText'>];
    if (fieldResult && fieldResult.confidence !== 'not_found') {
      totalWeight += weight;
      weightedScore += weight * confidenceScores[fieldResult.confidence];
    }
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) / 100 : 0;
}

function parseExtractionResponse(content: string): BadgeExtractionResult {
  try {
    // Try to parse the JSON response
    const parsed = JSON.parse(content);

    // Validate structure
    const defaultField: OCRFieldResult = { value: null, confidence: 'not_found' };

    return {
      firstName: parsed.firstName || defaultField,
      lastName: parsed.lastName || defaultField,
      company: parsed.company || defaultField,
      title: parsed.title || defaultField,
      email: parsed.email || defaultField,
      phone: parsed.phone || defaultField,
      rawText: parsed.rawText || '',
    };
  } catch {
    // If JSON parsing fails, return empty result
    return {
      firstName: { value: null, confidence: 'not_found' },
      lastName: { value: null, confidence: 'not_found' },
      company: { value: null, confidence: 'not_found' },
      title: { value: null, confidence: 'not_found' },
      email: { value: null, confidence: 'not_found' },
      phone: { value: null, confidence: 'not_found' },
      rawText: 'Failed to parse OCR response',
    };
  }
}

function toExtractedContact(result: BadgeExtractionResult): ExtractedContact {
  return {
    first_name: result.firstName.value || undefined,
    last_name: result.lastName.value || undefined,
    company: result.company.value || undefined,
    title: result.title.value || undefined,
    email: result.email.value || undefined,
    phone: result.phone.value || undefined,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { image_base64, image_url } = await req.json();

    if (!image_base64 && !image_url) {
      throw new Error('Either image_base64 or image_url is required');
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      // Return graceful fallback if no API key configured
      return new Response(
        JSON.stringify({
          success: true,
          extracted: {},
          ocr_data: null,
          ocr_confidence_score: 0,
          ocr_available: false,
          message: 'OCR not configured. Please add ANTHROPIC_API_KEY to Supabase secrets.',
          processingTimeMs: Date.now() - startTime,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Build the image content based on what was provided
    let imageContent: Anthropic.ImageBlockParam;

    if (image_url) {
      imageContent = {
        type: 'image',
        source: {
          type: 'url',
          url: image_url,
        },
      };
    } else {
      // Base64 image - determine media type
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

      // Check for common image type signatures
      if (image_base64.startsWith('iVBOR')) {
        mediaType = 'image/png';
      } else if (image_base64.startsWith('R0lGOD')) {
        mediaType = 'image/gif';
      } else if (image_base64.startsWith('UklGR')) {
        mediaType = 'image/webp';
      }

      imageContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: image_base64,
        },
      };
    }

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: BADGE_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    // Parse the structured response
    const ocrData = parseExtractionResponse(responseText);
    const overallConfidence = calculateOverallConfidence(ocrData);
    const extracted = toExtractedContact(ocrData);

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
        ocr_data: ocrData,
        ocr_confidence_score: overallConfidence,
        ocr_available: true,
        processingTimeMs: Date.now() - startTime,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Badge OCR Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process badge image',
        extracted: {},
        ocr_data: null,
        ocr_confidence_score: 0,
        ocr_available: true,
        processingTimeMs: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
