// Supabase Edge Function for generating AI-powered follow-up messages
// Deploy with: npx supabase functions deploy generate-follow-up
// Required secret: ANTHROPIC_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MessageStyle = 'professional' | 'casual' | 'brief';
type Channel = 'linkedin' | 'email';

interface FollowUpRequest {
  contactId: string;
  userId: string;
  style: MessageStyle;
  channel: Channel;
  userName?: string; // User's name for signature
}

interface FollowUpContext {
  contact: {
    firstName: string;
    lastName: string;
    company?: string;
    title?: string;
    email?: string;
    linkedinUrl?: string;
  };
  conference: {
    name: string;
    startDate: string;
    endDate: string;
  };
  notes: string[];
  sharedSessions: Array<{
    title: string;
    speakerName?: string;
  }>;
  daysSinceConference: number;
}

function buildFollowUpPrompt(
  context: FollowUpContext,
  style: MessageStyle,
  channel: Channel
): string {
  const styleGuide = {
    professional: `
Style: Professional but warm
- Use formal but friendly language
- Focus on business value and next steps
- Keep tone respectful and polished
- Include a clear, professional call-to-action`,
    casual: `
Style: Casual and personable
- Use friendly, conversational language
- Be warm and approachable
- Reference shared experiences naturally
- Keep the ask low-pressure`,
    brief: `
Style: Brief and direct
- Keep the message to 2-3 sentences maximum
- Get straight to the point
- Single clear ask
- No fluff or padding`,
  };

  const channelGuide = {
    linkedin: `
Channel: LinkedIn Message
- No subject line needed
- Keep under 300 characters for best engagement
- Don't include formal greeting like "Dear"
- End casually, no need for formal signature block`,
    email: `
Channel: Email
- Start with: Subject: [compelling subject line]
- Then blank line, then message body
- Can be slightly longer than LinkedIn
- Include professional sign-off`,
  };

  const notesSection = context.notes.length > 0
    ? `
USER'S NOTES ABOUT THIS CONTACT:
${context.notes.map(n => `- ${n}`).join('\n')}`
    : `
USER'S NOTES: None captured (use generic conference follow-up)`;

  const sessionsSection = context.sharedSessions.length > 0
    ? `
SESSIONS CONTEXT:
${context.sharedSessions.map(s => `- ${s.title}${s.speakerName ? ` (Speaker: ${s.speakerName})` : ''}`).join('\n')}`
    : '';

  const timeContext = context.daysSinceConference <= 3
    ? 'This is a timely follow-up right after the conference.'
    : context.daysSinceConference <= 14
    ? 'This is within two weeks of the conference - still fresh.'
    : `It has been ${context.daysSinceConference} days since the conference - acknowledge the time gap briefly.`;

  return `You are helping a professional write a follow-up message after meeting someone at a conference. Generate a personalized, authentic message based on the context provided.

CONTACT INFORMATION:
- Name: ${context.contact.firstName} ${context.contact.lastName}
- Company: ${context.contact.company || 'Not specified'}
- Title: ${context.contact.title || 'Not specified'}

CONFERENCE:
- Name: ${context.conference.name}
- Dates: ${context.conference.startDate} to ${context.conference.endDate}
- ${timeContext}
${notesSection}
${sessionsSection}

${styleGuide[style]}

${channelGuide[channel]}

GUIDELINES:
1. Reference something specific from the notes or context if available
2. Make a clear, low-commitment ask (coffee chat, quick call, etc.)
3. Keep it concise - busy professionals appreciate brevity
4. Sound human and genuine, not templated
5. Don't be pushy or salesy
6. If notes mention specific interests or pain points, weave them in naturally
7. Don't make up specific details that weren't provided

Generate ONLY the message content. No explanations or alternatives.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { contactId, userId, style, channel, userName } = await req.json() as FollowUpRequest;

    if (!contactId || !userId || !style || !channel) {
      throw new Error('Missing required fields: contactId, userId, style, channel');
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service not configured. Please add ANTHROPIC_API_KEY to Supabase secrets.',
          message: null,
          context: null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, conferences(*)')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact not found: ${contactError?.message || 'Unknown error'}`);
    }

    // 2. Fetch user's session attendance (to find shared sessions context)
    const { data: attendance } = await supabase
      .from('session_attendance')
      .select(`
        sessions (
          title,
          speaker_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'attended');

    const sharedSessions = (attendance || [])
      .filter(a => a.sessions)
      .map(a => ({
        title: a.sessions.title,
        speakerName: a.sessions.speaker_name,
      }))
      .slice(0, 3); // Limit to 3 most relevant

    // 3. Calculate days since conference
    const conferenceEndDate = new Date(contact.conferences.end_date);
    const today = new Date();
    const daysSinceConference = Math.floor(
      (today.getTime() - conferenceEndDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 4. Build context object
    const context: FollowUpContext = {
      contact: {
        firstName: contact.first_name,
        lastName: contact.last_name,
        company: contact.company,
        title: contact.title,
        email: contact.email,
        linkedinUrl: contact.linkedin_url,
      },
      conference: {
        name: contact.conferences.name,
        startDate: contact.conferences.start_date,
        endDate: contact.conferences.end_date,
      },
      notes: contact.notes ? [contact.notes] : [],
      sharedSessions,
      daysSinceConference: Math.max(0, daysSinceConference),
    };

    // 5. Generate message with Claude
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: buildFollowUpPrompt(context, style, channel),
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    let message = textContent?.type === 'text' ? textContent.text : '';

    // For email, parse subject line if present
    let subject: string | undefined;
    if (channel === 'email' && message.toLowerCase().startsWith('subject:')) {
      const lines = message.split('\n');
      subject = lines[0].replace(/^subject:\s*/i, '').trim();
      message = lines.slice(1).join('\n').trim();
    }

    // Add user's name as signature if provided and not already present
    if (userName && !message.includes(userName)) {
      if (style === 'brief') {
        message = message.trimEnd() + `\n\n- ${userName}`;
      } else if (style === 'casual') {
        message = message.trimEnd() + `\n\nCheers,\n${userName}`;
      } else {
        message = message.trimEnd() + `\n\nBest regards,\n${userName}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        subject,
        context: {
          contactName: `${context.contact.firstName} ${context.contact.lastName}`,
          company: context.contact.company,
          conferenceName: context.conference.name,
          notesUsed: context.notes,
          sessionsReferenced: context.sharedSessions.map(s => s.title),
          daysSinceConference: context.daysSinceConference,
        },
        style,
        channel,
        processingTimeMs: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Follow-up generation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate follow-up message',
        message: null,
        context: null,
        processingTimeMs: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
