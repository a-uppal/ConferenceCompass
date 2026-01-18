// Supabase Edge Function for processing badge photos with OCR
// Deploy with: supabase functions deploy process-badge-photo

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedContact {
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
}

// Simple pattern matching for contact info extraction
function extractContactInfo(text: string): ExtractedContact {
  const result: ExtractedContact = {};

  // Email pattern
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // Phone pattern (various formats)
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // Try to extract name (usually first lines, before company info)
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length > 0) {
    // First non-email, non-phone line is often the name
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        !trimmed.includes('@') &&
        !trimmed.match(/\d{3}[-.\s]?\d{3}/) &&
        trimmed.length > 2 &&
        trimmed.length < 50
      ) {
        const nameParts = trimmed.split(/\s+/);
        if (nameParts.length >= 2) {
          result.first_name = nameParts[0];
          result.last_name = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          result.first_name = nameParts[0];
        }
        break;
      }
    }
  }

  // Try to find company (often after name, or has common suffixes)
  const companyPatterns = [
    /(?:Inc\.|LLC|Corp\.|Corporation|Company|Co\.|Ltd\.)/i,
    /(?:Pharma|Bio|Tech|Sciences|Healthcare|Medical|Research)/i,
  ];

  for (const line of lines) {
    for (const pattern of companyPatterns) {
      if (pattern.test(line)) {
        result.company = line.trim();
        break;
      }
    }
    if (result.company) break;
  }

  // Try to find title (common job title keywords)
  const titlePatterns = [
    /(?:Director|Manager|VP|Vice President|CEO|CTO|CFO|President)/i,
    /(?:Scientist|Engineer|Analyst|Specialist|Lead|Head|Chief)/i,
    /(?:Associate|Senior|Junior|Principal|Executive)/i,
  ];

  for (const line of lines) {
    for (const pattern of titlePatterns) {
      if (pattern.test(line) && line !== result.company) {
        result.title = line.trim();
        break;
      }
    }
    if (result.title) break;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_base64, image_uri } = await req.json();

    if (!image_base64 && !image_uri) {
      throw new Error('Either image_base64 or image_uri is required');
    }

    // For now, we'll use a simple OCR approach
    // In production, you could integrate with:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js (client-side)

    // Check if we have a configured OCR service
    const ocrApiKey = Deno.env.get('OCR_API_KEY');
    const ocrEndpoint = Deno.env.get('OCR_ENDPOINT');

    let extractedText = '';

    if (ocrApiKey && ocrEndpoint) {
      // Call external OCR service
      const ocrResponse = await fetch(ocrEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ocrApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image_base64,
        }),
      });

      if (ocrResponse.ok) {
        const ocrData = await ocrResponse.json();
        extractedText = ocrData.text || '';
      }
    }

    // Extract contact info from text
    const extracted = extractContactInfo(extractedText);

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
        raw_text: extractedText,
        ocr_available: !!(ocrApiKey && ocrEndpoint),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        extracted: {},
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
